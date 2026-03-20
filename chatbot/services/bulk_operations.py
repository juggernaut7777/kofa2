"""
Bulk Operations Service for CSV import/export and mass updates.
Enables vendors to manage inventory at scale.
Uses SQLAlchemy (Azure SQL) — no Supabase dependency.
"""
import csv
import io
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime
import uuid


@dataclass
class ImportResult:
    """Result of a bulk import operation."""
    success_count: int
    error_count: int
    errors: List[Dict]
    created_ids: List[str]


@dataclass 
class ExportResult:
    """Result of a bulk export operation."""
    csv_content: str
    row_count: int
    exported_at: datetime


class BulkOperationsService:
    """Handle bulk import/export and mass updates for inventory via SQLAlchemy."""
    
    # Expected CSV columns for product import
    PRODUCT_COLUMNS = [
        "name", "price_ngn", "stock_level", "category", 
        "description", "voice_tags", "image_url"
    ]
    
    def parse_csv(self, csv_content: str) -> Tuple[List[Dict], List[Dict]]:
        """
        Parse CSV content into list of product dictionaries.
        
        Returns:
            Tuple of (valid_products, errors)
        """
        valid_products = []
        errors = []
        
        try:
            reader = csv.DictReader(io.StringIO(csv_content))
            
            for row_num, row in enumerate(reader, start=2):  # Start at 2 (header is row 1)
                try:
                    product = self._validate_product_row(row, row_num)
                    if product:
                        valid_products.append(product)
                except ValueError as e:
                    errors.append({
                        "row": row_num,
                        "error": str(e),
                        "data": row
                    })
                    
        except Exception as e:
            errors.append({"row": 0, "error": f"CSV parse error: {e}"})
        
        return valid_products, errors
    
    def _validate_product_row(self, row: Dict, row_num: int) -> Optional[Dict]:
        """Validate and normalize a product row from CSV."""
        # Required fields
        name = row.get("name", "").strip()
        if not name:
            raise ValueError("Product name is required")
        
        # Price (required)
        try:
            price_str = row.get("price_ngn", "0").replace(",", "").replace("₦", "")
            price_ngn = float(price_str)
            if price_ngn < 0:
                raise ValueError("Price cannot be negative")
        except ValueError:
            raise ValueError(f"Invalid price: {row.get('price_ngn')}")
        
        # Stock (optional, default 0)
        try:
            stock_level = int(row.get("stock_level", "0"))
            if stock_level < 0:
                stock_level = 0
        except ValueError:
            stock_level = 0
        
        # Voice tags (comma-separated)
        voice_tags_str = row.get("voice_tags", "")
        voice_tags = [t.strip() for t in voice_tags_str.split(",") if t.strip()]
        
        return {
            "name": name,
            "price_ngn": price_ngn,
            "stock_level": stock_level,
            "category": row.get("category", "").strip() or None,
            "description": row.get("description", "").strip() or None,
            "voice_tags": voice_tags,
            "image_url": row.get("image_url", "").strip() or None
        }
    
    async def import_products(
        self, 
        vendor_id: str, 
        csv_content: str,
        update_existing: bool = False
    ) -> ImportResult:
        """
        Import products from CSV using SQLAlchemy.
        """
        from ..database import SessionLocal
        from ..models import Product
        
        valid_products, parse_errors = self.parse_csv(csv_content)
        
        if not valid_products and parse_errors:
            return ImportResult(
                success_count=0,
                error_count=len(parse_errors),
                errors=parse_errors,
                created_ids=[]
            )
        
        created_ids = []
        import_errors = parse_errors.copy()
        
        db = SessionLocal()
        try:
            for product_data in valid_products:
                try:
                    # Check if product exists (by name for this vendor)
                    existing = db.query(Product).filter(
                        Product.user_id == vendor_id,
                        Product.name == product_data["name"]
                    ).first()
                    
                    if existing and update_existing:
                        existing.price_ngn = product_data["price_ngn"]
                        existing.stock_level = product_data["stock_level"]
                        if product_data["category"]:
                            existing.category = product_data["category"]
                        if product_data["description"]:
                            existing.description = product_data["description"]
                        if product_data["image_url"]:
                            existing.image_url = product_data["image_url"]
                        created_ids.append(existing.id)
                    elif not existing:
                        new_product = Product(
                            id=str(uuid.uuid4()),
                            user_id=vendor_id,
                            name=product_data["name"],
                            price_ngn=product_data["price_ngn"],
                            stock_level=product_data["stock_level"],
                            category=product_data.get("category"),
                            description=product_data.get("description"),
                            image_url=product_data.get("image_url"),
                        )
                        db.add(new_product)
                        created_ids.append(new_product.id)
                        
                except Exception as e:
                    import_errors.append({
                        "product": product_data["name"],
                        "error": str(e)
                    })
            
            db.commit()
        except Exception as e:
            db.rollback()
            import_errors.append({"error": f"Database error: {str(e)}"})
        finally:
            db.close()
        
        return ImportResult(
            success_count=len(created_ids),
            error_count=len(import_errors),
            errors=import_errors,
            created_ids=created_ids
        )
    
    async def export_products(self, vendor_id: str) -> ExportResult:
        """Export all vendor products to CSV using SQLAlchemy."""
        from ..database import SessionLocal
        from ..models import Product
        
        db = SessionLocal()
        try:
            products = db.query(Product).filter(
                Product.user_id == vendor_id
            ).order_by(Product.name).all()
            
            # Build CSV
            output = io.StringIO()
            writer = csv.DictWriter(output, fieldnames=self.PRODUCT_COLUMNS)
            writer.writeheader()
            
            for p in products:
                writer.writerow({
                    "name": p.name or "",
                    "price_ngn": p.price_ngn or 0,
                    "stock_level": p.stock_level or 0,
                    "category": p.category or "",
                    "description": p.description or "",
                    "voice_tags": "",
                    "image_url": p.image_url or ""
                })
            
            return ExportResult(
                csv_content=output.getvalue(),
                row_count=len(products),
                exported_at=datetime.now()
            )
        finally:
            db.close()
    
    async def bulk_update_prices(
        self, 
        vendor_id: str, 
        percent_change: float,
        category: Optional[str] = None
    ) -> Dict:
        """Update prices by percentage using SQLAlchemy."""
        from ..database import SessionLocal
        from ..models import Product
        
        db = SessionLocal()
        try:
            query = db.query(Product).filter(Product.user_id == vendor_id)
            if category:
                query = query.filter(Product.category == category)
            
            products = query.all()
            
            if not products:
                return {"success": True, "updated_count": 0, "message": "No products found"}
            
            multiplier = 1 + (percent_change / 100)
            
            for product in products:
                product.price_ngn = round(product.price_ngn * multiplier, 2)
            
            db.commit()
            
            return {
                "success": True,
                "updated_count": len(products),
                "percent_change": percent_change,
                "category": category or "all"
            }
            
        except Exception as e:
            db.rollback()
            return {"success": False, "error": str(e)}
        finally:
            db.close()
    
    async def bulk_restock(
        self, 
        vendor_id: str, 
        restock_data: List[Dict]
    ) -> Dict:
        """Bulk restock multiple products using SQLAlchemy."""
        from ..database import SessionLocal
        from ..models import Product
        
        db = SessionLocal()
        updated = 0
        errors = []
        
        try:
            for item in restock_data:
                try:
                    product_id = item.get("product_id")
                    quantity = item.get("quantity", 0)
                    
                    product = db.query(Product).filter(
                        Product.id == product_id,
                        Product.user_id == vendor_id
                    ).first()
                    
                    if product:
                        product.stock_level = (product.stock_level or 0) + quantity
                        updated += 1
                    else:
                        errors.append({"product_id": product_id, "error": "Product not found"})
                        
                except Exception as e:
                    errors.append({"product_id": item.get("product_id"), "error": str(e)})
            
            db.commit()
        except Exception as e:
            db.rollback()
            errors.append({"error": f"Database error: {str(e)}"})
        finally:
            db.close()
        
        return {
            "success": True,
            "updated_count": updated,
            "error_count": len(errors),
            "errors": errors
        }
    
    def generate_template_csv(self) -> str:
        """Generate a blank CSV template for product import."""
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=self.PRODUCT_COLUMNS)
        writer.writeheader()
        
        # Add example row
        writer.writerow({
            "name": "Example Product",
            "price_ngn": "5000",
            "stock_level": "10",
            "category": "Electronics",
            "description": "Product description here",
            "voice_tags": "tag1,tag2,tag3",
            "image_url": ""
        })
        
        return output.getvalue()


# Singleton instance
bulk_service = BulkOperationsService()

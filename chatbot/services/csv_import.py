"""
CSV Import/Export Service for KOFA
Allows bulk product upload from spreadsheets and export of inventory.
"""
import csv
import io
import json
import uuid
import logging
from typing import List, Dict, Tuple

logger = logging.getLogger(__name__)

# Expected CSV columns for product import
REQUIRED_COLUMNS = ["name", "price"]
OPTIONAL_COLUMNS = ["stock", "category", "description", "cost_price", "image_url"]


def export_products_csv(products: List[Dict]) -> str:
    """
    Export products to CSV string.
    
    Args:
        products: List of product dicts from InventoryManager.list_products()
    
    Returns:
        CSV string ready for download
    """
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=[
        "id", "name", "price_ngn", "cost_price", "stock_level",
        "category", "description", "image_url"
    ])
    writer.writeheader()
    
    for product in products:
        writer.writerow({
            "id": product.get("id", ""),
            "name": product.get("name", ""),
            "price_ngn": product.get("price_ngn", 0),
            "cost_price": product.get("cost_price", ""),
            "stock_level": product.get("stock_level", 0),
            "category": product.get("category", ""),
            "description": product.get("description", ""),
            "image_url": product.get("image_url", ""),
        })
    
    return output.getvalue()


def parse_products_csv(csv_content: str) -> Tuple[List[Dict], List[str]]:
    """
    Parse CSV content into product dicts for import.
    
    Args:
        csv_content: Raw CSV string
    
    Returns:
        Tuple of (valid_products, error_messages)
    """
    products = []
    errors = []
    
    try:
        reader = csv.DictReader(io.StringIO(csv_content))
        
        # Normalize headers (lowercase, strip whitespace)
        if reader.fieldnames:
            reader.fieldnames = [f.strip().lower().replace(" ", "_") for f in reader.fieldnames]
        
        for row_num, row in enumerate(reader, start=2):  # Start at 2 (header is row 1)
            try:
                # Validate required fields
                name = (row.get("name") or row.get("product_name") or "").strip()
                price_str = (row.get("price") or row.get("price_ngn") or "0").strip()
                
                if not name:
                    errors.append(f"Row {row_num}: Missing product name")
                    continue
                
                # Parse price (handle ₦ symbol and commas)
                price_str = price_str.replace("₦", "").replace(",", "").strip()
                try:
                    price = float(price_str)
                except ValueError:
                    errors.append(f"Row {row_num}: Invalid price '{price_str}' for {name}")
                    continue
                
                if price < 0:
                    errors.append(f"Row {row_num}: Negative price for {name}")
                    continue
                
                # Parse optional fields
                stock_str = (row.get("stock") or row.get("stock_level") or row.get("quantity") or "0").strip()
                try:
                    stock = int(float(stock_str))
                except ValueError:
                    stock = 0
                
                cost_str = (row.get("cost_price") or row.get("cost") or "").strip()
                cost_price = None
                if cost_str:
                    try:
                        cost_price = float(cost_str.replace("₦", "").replace(",", ""))
                    except ValueError:
                        pass
                
                product = {
                    "name": name,
                    "price_ngn": price,
                    "stock_level": max(0, stock),
                    "category": (row.get("category") or "").strip(),
                    "description": (row.get("description") or "").strip(),
                    "cost_price": cost_price,
                    "image_url": (row.get("image_url") or "").strip() or None,
                }
                products.append(product)
                
            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
    
    except Exception as e:
        errors.append(f"CSV parse error: {str(e)}")
    
    return products, errors


def import_products(inventory_manager, csv_content: str) -> Dict:
    """
    Import products from CSV into inventory.
    
    Args:
        inventory_manager: InventoryManager instance (vendor-scoped)
        csv_content: Raw CSV string
    
    Returns:
        Dict with import results
    """
    products, errors = parse_products_csv(csv_content)
    
    imported = 0
    skipped = 0
    
    for product_data in products:
        try:
            result = inventory_manager.add_product(product_data)
            if result:
                imported += 1
            else:
                skipped += 1
                errors.append(f"Failed to import: {product_data['name']}")
        except Exception as e:
            skipped += 1
            errors.append(f"Error importing {product_data['name']}: {str(e)}")
    
    return {
        "imported": imported,
        "skipped": skipped,
        "total_in_csv": len(products) + len(errors),
        "errors": errors[:10],  # Limit error messages
    }

"""
Azure Application Insights monitoring for KOFA.
Tracks API requests, errors, and custom metrics.
"""
import os
import logging
from opencensus.ext.azure.log_exporter import AzureLogHandler
from opencensus.ext.azure.trace_exporter import AzureExporter
from opencensus.trace.samplers import AlwaysOnSampler
from opencensus.trace.tracer import Tracer

# Application Insights connection string
APPINSIGHTS_CONNECTION_STRING = os.getenv(
    "APPINSIGHTS_CONNECTION_STRING",
    "InstrumentationKey=de828b35-2c79-4751-b13d-49a8aef8e8b1;IngestionEndpoint=https://polandcentral-0.in.applicationinsights.azure.com/;LiveEndpoint=https://polandcentral.livediagnostics.monitor.azure.com/"
)

# Set up logger with Azure handler
logger = logging.getLogger(__name__)

def setup_azure_monitoring():
    """Initialize Azure Application Insights monitoring."""
    try:
        if APPINSIGHTS_CONNECTION_STRING:
            # Add Azure log handler
            azure_handler = AzureLogHandler(
                connection_string=APPINSIGHTS_CONNECTION_STRING
            )
            logger.addHandler(azure_handler)
            logger.setLevel(logging.INFO)
            
            # Create tracer for request tracking
            tracer = Tracer(
                exporter=AzureExporter(connection_string=APPINSIGHTS_CONNECTION_STRING),
                sampler=AlwaysOnSampler()
            )
            
            logger.info("KOFA: Azure Application Insights initialized")
            return tracer
        else:
            logger.warning("KOFA: No Application Insights connection string found")
            return None
    except Exception as e:
        logger.error(f"KOFA: Failed to initialize Application Insights: {e}")
        return None


def log_request(method: str, path: str, status_code: int, duration_ms: float):
    """Log API request to Application Insights."""
    try:
        logger.info(
            f"API Request: {method} {path}",
            extra={
                'custom_dimensions': {
                    'method': method,
                    'path': path,
                    'status_code': status_code,
                    'duration_ms': duration_ms
                }
            }
        )
    except Exception:
        pass  # Don't let monitoring errors break the app


def log_error(error: str, path: str = None, user_id: str = None):
    """Log error to Application Insights."""
    try:
        logger.error(
            f"API Error: {error}",
            extra={
                'custom_dimensions': {
                    'path': path,
                    'user_id': user_id,
                    'error': error
                }
            }
        )
    except Exception:
        pass


def log_custom_event(event_name: str, properties: dict = None):
    """Log custom event to Application Insights."""
    try:
        logger.info(
            f"Custom Event: {event_name}",
            extra={
                'custom_dimensions': properties or {}
            }
        )
    except Exception:
        pass


def log_business_metric(metric_name: str, value: float, properties: dict = None):
    """Log business metric to Application Insights."""
    try:
        logger.info(
            f"Metric: {metric_name}={value}",
            extra={
                'custom_dimensions': {
                    'metric_name': metric_name,
                    'metric_value': value,
                    **(properties or {})
                }
            }
        )
    except Exception:
        pass


# Initialize on module load
tracer = setup_azure_monitoring()

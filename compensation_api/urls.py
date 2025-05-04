"""
URL configuration for the compensation API.

This module defines the URL patterns for the compensation API endpoints.
"""

from django.urls import path
from .views import CalculateCompensationView, UploadDataView

urlpatterns = [
    path('calculate/', CalculateCompensationView.as_view(), name='calculate_compensation'),
    path('upload-data/', UploadDataView.as_view(), name='upload_data'),
]

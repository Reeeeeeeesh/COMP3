"""
URL configuration for the compensation project.

This module defines the URL patterns for the entire project,
including the compensation API endpoints.
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('compensation_api.urls')),
]

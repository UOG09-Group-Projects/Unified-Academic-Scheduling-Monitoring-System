from django.urls import path
from .views import EducatorListCreateView, EducatorDetailView, EducatorBulkImportView

urlpatterns = [
    path('educators/bulk-import/', EducatorBulkImportView.as_view(), name='educator-bulk-import'),
    path('educators/', EducatorListCreateView.as_view(), name='educator-list-create'),
    path('educators/<int:pk>/', EducatorDetailView.as_view(), name='educator-detail'),
]

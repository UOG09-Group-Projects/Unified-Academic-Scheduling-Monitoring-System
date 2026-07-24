from django.urls import path
from .views import (
    ComplaintListCreateView, ComplaintDetailView, ComplaintStatsView,
    ContactInquiryPublicCreateView, ContactInquiryListView,
    ContactInquiryDetailView, ContactInquiryStatsView,
)

urlpatterns = [
    path('complaints/', ComplaintListCreateView.as_view(), name='complaint-list'),
    path('complaints/<int:pk>/', ComplaintDetailView.as_view(), name='complaint-detail'),
    path('complaints/stats/', ComplaintStatsView.as_view(), name='complaint-stats'),

    path('contact/', ContactInquiryPublicCreateView.as_view(), name='contact-create'),
    path('contact/inquiries/', ContactInquiryListView.as_view(), name='contact-inquiry-list'),
    path('contact/inquiries/<int:pk>/', ContactInquiryDetailView.as_view(), name='contact-inquiry-detail'),
    path('contact/inquiries/stats/', ContactInquiryStatsView.as_view(), name='contact-inquiry-stats'),
]

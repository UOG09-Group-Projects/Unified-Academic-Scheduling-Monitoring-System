from django.urls import path
from .views import (
    InstitutionListCreateView, InstitutionDetailView, InstitutionPublicListView,
    InstitutionRegisterView, InstitutionStatusView,
)
from institutions import role_views

urlpatterns = [
    path('public/', InstitutionPublicListView.as_view(), name='institution-public-list'),
    path('register/', InstitutionRegisterView.as_view(), name='institution-register'),
    path('', InstitutionListCreateView.as_view(), name='institution-list-create'),
    path('<int:pk>/', InstitutionDetailView.as_view(), name='institution-detail'),
    path('<int:pk>/status/', InstitutionStatusView.as_view(), name='institution-status'),

    # Remove the "api/" prefix — it's already provided by the root urls.py
    # institutions/urls.py
    path("roles/",          role_views.RoleListCreateView.as_view(),  name="role-list-create"),
    path("roles/<int:pk>/", role_views.RoleDetailView.as_view(),      name="role-detail"),
    path("permissions/",    role_views.PermissionListView.as_view(),  name="permission-list"),
]
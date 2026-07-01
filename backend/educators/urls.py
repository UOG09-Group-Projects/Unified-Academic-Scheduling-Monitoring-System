from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EducatorViewSet

router = DefaultRouter()
router.register(r'educators', EducatorViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
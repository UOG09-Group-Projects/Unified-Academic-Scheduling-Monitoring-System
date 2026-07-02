from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Educator
from .serializers import EducatorSerializer

class EducatorViewSet(viewsets.ModelViewSet):
    queryset = Educator.objects.all().order_by('-created_at')
    serializer_class = EducatorSerializer
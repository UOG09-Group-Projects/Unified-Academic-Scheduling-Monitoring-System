from rest_framework import viewsets, status
from rest_framework.response import Response
from institutions.models import Educator
from .serializers import EducatorSerializer
from institutions.models import User


class EducatorViewSet(viewsets.ModelViewSet):
    queryset = Educator.objects.all().order_by('-created_at')
    serializer_class = EducatorSerializer

    def create(self, request, *args, **kwargs):
        print("========== CREATE EDUCATOR ==========")
        print(request.data)
        data = request.data.copy()
        password = data.get('password', None)
        email = data.get('email', '').strip()

        # Validate required fields
        if not email:
            return Response(
                {'error': 'Email is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not password:
            return Response(
                {'error': 'Password is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user already exists with this email
        if User.objects.filter(email=email).exists():
            return Response(
                {'error': 'A user with this email already exists.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create the User account
        try:
            user = User(
                username=email,  # use email as username
                email=email,
                is_active=True,
                is_email_verified=True,
            )
            user.set_password(password)
            user.save()
        except Exception as e:
            return Response(
                {'error': f'Failed to create user account: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create the Educator record
        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            try:
                educator = serializer.save(user=user)
                return Response(
                    self.get_serializer(educator).data,
                    status=status.HTTP_201_CREATED
                )
            except Exception as e:
                # Roll back the user if educator creation fails
                user.delete()
                return Response(
                    {'error': f'Failed to create educator: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            # Roll back the user if serializer is invalid
            user.delete()
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        educator = self.get_object()
        data = request.data.copy()
        password = data.get('password', None)

        # If password is provided, update the linked user account
        if password and hasattr(educator, 'user') and educator.user:
            educator.user.set_password(password)
            educator.user.save()

        serializer = self.get_serializer(educator, data=data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def get(self, request):
        institution_id = request.query_params.get('institution_id')
        
        educators = Educator.objects.filter(is_deleted=False)
        
        if institution_id:
            educators = educators.filter(institution_id=institution_id)
        
        # MANAGER should ONLY see their own institution — enforce it
            educators = educators.filter(
                institution_id=request.current_user.institution_id
            )
        
        data = [{"id": e.id, "name": e.user.get_full_name()} for e in educators]
        return JsonResponse(data, safe=False)
    

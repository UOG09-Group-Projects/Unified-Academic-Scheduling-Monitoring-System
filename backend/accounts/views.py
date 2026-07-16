import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt

from institutions.models import User
from institutions.jwt_utils import jwt_required


@csrf_exempt
@jwt_required()
def profile_view(request):
    try:
        user = request.current_user
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found.'}, status=404)

    if request.method == 'GET':
        picture_url = None
        if user.profile_picture:
            picture_url = request.build_absolute_uri(user.profile_picture.url)
        return JsonResponse({
            'id':                user.id,
            'username':          user.username,
            'email':             user.email,
            'role':              user.role.name,
            'is_active':         user.is_active,
            'is_email_verified': user.is_email_verified,
            'profile_picture':   picture_url,
        })

    if request.method == 'PATCH':
        # JSON only — Django does not parse multipart for PATCH
        try:
            body = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON.'}, status=400)

        username = body.get('username', '').strip()
        email    = body.get('email', '').strip()

        if username and username != user.username:
            if User.objects.filter(username=username).exclude(pk=user.pk).exists():
                return JsonResponse({'error': 'Username already taken.'}, status=400)
            user.username = username

        if email and email != user.email:
            if User.objects.filter(email=email).exclude(pk=user.pk).exists():
                return JsonResponse({'error': 'Email already in use.'}, status=400)
            user.email = email

        user.save()

        picture_url = None
        if user.profile_picture:
            picture_url = request.build_absolute_uri(user.profile_picture.url)

        return JsonResponse({
            'message': 'Profile updated successfully.',
            'user': {
                'id':              user.id,
                'username':        user.username,
                'email':           user.email,
                'role':            user.role.name,
                'profile_picture': picture_url,
            }
        })

    return JsonResponse({'error': 'Method not allowed.'}, status=405)


@csrf_exempt
@require_http_methods(['POST'])
@jwt_required()
def profile_picture_view(request):
    user = request.current_user  # ✅ already a User instance

    picture = request.FILES.get('profile_picture')
    if not picture:
        return JsonResponse({'error': 'No image provided.'}, status=400)

    # Delete old file to avoid orphans
    if user.profile_picture:
        import os
        old_path = user.profile_picture.path
        if os.path.exists(old_path):
            os.remove(old_path)

    user.profile_picture = picture
    user.save(update_fields=['profile_picture'])

    return JsonResponse({
        'message': 'Profile picture updated successfully.',
        'profile_picture': request.build_absolute_uri(user.profile_picture.url),
    })


@csrf_exempt
@require_http_methods(['POST'])
@jwt_required()
def change_password_view(request):
    user = request.current_user  # ✅ already a User instance

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON.'}, status=400)

    current = body.get('current_password', '')
    new     = body.get('new_password', '')
    confirm = body.get('confirm_password', '')

    if not all([current, new, confirm]):
        return JsonResponse({'error': 'All fields are required.'}, status=400)

    if not user.check_password(current):
        return JsonResponse({'error': 'Current password is incorrect.'}, status=400)

    if new != confirm:
        return JsonResponse({'error': 'New passwords do not match.'}, status=400)

    if len(new) < 8:
        return JsonResponse({'error': 'Password must be at least 8 characters.'}, status=400)

    user.set_password(new)
    user.save(update_fields=['hashed_password', 'salt'])

    return JsonResponse({'message': 'Password changed successfully.'})


"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
# project/urls.py


from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from auth import dashboard_views

urlpatterns = [
    path('admin/', admin.site.urls),

    # existing apps
    path('api/institutions/', include('institutions.urls')),
    path('api/', include('batches.urls')),
    path('api/auth/', include('auth.urls')),
    path('api/user/', include('accounts.urls')),
    # merged feature
    path('api/', include('course.urls')),
    path('api/', include('educators.urls')),
    path('api/', include('students.urls')),
    path('api/', include('managers.urls')),
    path('api/calendar/', include('events.urls')),
    path('api/', include('enrollments.urls')),
    path('api/', include('activities.urls')),

    path('api/dashboard/manager/', dashboard_views.manager_dashboard),
    path('api/dashboard/super-admin/', dashboard_views.super_admin_dashboard),
    path('api/dashboard/educator/', dashboard_views.educator_dashboard),
    path('api/dashboard/student/', dashboard_views.student_dashboard),
    path('api/dashboard/parent/', dashboard_views.parent_dashboard),
    path('api/dashboard/parent/report/', dashboard_views.parent_monthly_report),
    
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

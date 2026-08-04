from django.urls import path
from .views import (
    InstitutionListCreateView, InstitutionDetailView, InstitutionPublicListView,
    InstitutionRegisterView, InstitutionStatusView, InstitutionJoinCodeView,
    InstitutionSemesterView,
    PlatformSettingsView, PlatformSettingsResetView, PublicPlatformSettingsView,
    AuditLogListView, LoginActivityListView, MaintenanceReportView,
    InstitutionDetailsListView, OwnerUsersListView, AnalyticsTrendsView,
    ImpersonateStartView, ImpersonateStopView,
    AnnouncementListCreateView, AnnouncementDetailView,
)
from .notification_views import (
    NotificationListView, NotificationMarkReadView, NotificationMarkAllReadView,
)
from institutions import role_views

urlpatterns = [
    path('public/', InstitutionPublicListView.as_view(), name='institution-public-list'),
    path('register/', InstitutionRegisterView.as_view(), name='institution-register'),
    path('audit-logs/', AuditLogListView.as_view(), name='audit-log-list'),
    path('login-activity/', LoginActivityListView.as_view(), name='login-activity-list'),
    path('analytics/trends/', AnalyticsTrendsView.as_view(), name='analytics-trends'),
    path('maintenance-report/', MaintenanceReportView.as_view(), name='maintenance-report'),
    path('institution-details/', InstitutionDetailsListView.as_view(), name='institution-details-list'),
    path('owner-users/', OwnerUsersListView.as_view(), name='owner-users-list'),
    path('notifications/', NotificationListView.as_view(), name='notification-list'),
    path('notifications/<int:pk>/read/', NotificationMarkReadView.as_view(), name='notification-mark-read'),
    path('notifications/read-all/', NotificationMarkAllReadView.as_view(), name='notification-mark-all-read'),
    path('', InstitutionListCreateView.as_view(), name='institution-list-create'),
    path('<int:pk>/', InstitutionDetailView.as_view(), name='institution-detail'),
    path('<int:pk>/status/', InstitutionStatusView.as_view(), name='institution-status'),
    path('join-code/', InstitutionJoinCodeView.as_view(), name='institution-join-code'),
    path('semester/', InstitutionSemesterView.as_view(), name='institution-semester'),
    path('settings/', PlatformSettingsView.as_view(), name='platform-settings'),
    path('settings/reset/', PlatformSettingsResetView.as_view(), name='platform-settings-reset'),
    path('settings/public/', PublicPlatformSettingsView.as_view(), name='platform-settings-public'),
    path('impersonate/start/', ImpersonateStartView.as_view(), name='impersonate-start'),
    path('impersonate/stop/', ImpersonateStopView.as_view(), name='impersonate-stop'),
    path('announcements/', AnnouncementListCreateView.as_view(), name='announcement-list-create'),
    path('announcements/<int:pk>/', AnnouncementDetailView.as_view(), name='announcement-detail'),

    # Remove the "api/" prefix — it's already provided by the root urls.py
    # institutions/urls.py
    path("roles/",          role_views.RoleListCreateView.as_view(),  name="role-list-create"),
    path("roles/<int:pk>/", role_views.RoleDetailView.as_view(),      name="role-detail"),
    path("permissions/",    role_views.PermissionListView.as_view(),  name="permission-list"),
]
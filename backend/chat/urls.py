from django.urls import path
from .views import BatchChatMessagesView
from .dm_views import (
    DmContactsView, DmMessagesView, DmOversightListView, DmOversightMessagesView,
)

urlpatterns = [
    path('batch/messages/', BatchChatMessagesView.as_view(), name='chat-batch-messages'),

    path('dm/contacts/', DmContactsView.as_view(), name='dm-contacts'),
    path('dm/oversight/', DmOversightListView.as_view(), name='dm-oversight-list'),
    path('dm/oversight/<int:conversation_id>/messages/', DmOversightMessagesView.as_view(), name='dm-oversight-messages'),
    path('dm/<int:peer_id>/messages/', DmMessagesView.as_view(), name='dm-messages'),
]

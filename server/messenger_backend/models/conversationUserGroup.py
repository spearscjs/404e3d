from django.db import models
from django.db.models import Q

from . import utils
from .user import User
from .conversation import Conversation


class ConversationUserGroup(utils.CustomModel):

    conversationId = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        db_column="conversationId",
    )

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, db_column="userId", related_name="+"
    )

    addedAt = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        unique_together = ('conversationId', 'user',)


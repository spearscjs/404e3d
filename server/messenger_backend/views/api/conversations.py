from django.contrib.auth.middleware import get_user
from django.db.models import Max, Q
from django.db.models.query import Prefetch
from django.http import HttpResponse, JsonResponse
from messenger_backend.models import Conversation, Message
from online_users import online_users
from rest_framework.views import APIView
from rest_framework.request import Request


class Conversations(APIView):
    """get all conversations for a user, include latest message text for preview, and all messages
    include other user model so we have info on username/profile pic (don't include current user info)
    TODO: for scalability, implement lazy loading"""

    def get(self, request: Request):
        try:
            user = get_user(request)

            if user.is_anonymous:
                return HttpResponse(status=401)
            user_id = user.id

            conversations = (
                Conversation.objects.filter(Q(user1=user_id) | Q(user2=user_id))
                .prefetch_related(
                    Prefetch(
                        # TICKET 1: FIXED ORDER BY RIDDING OF '-' in django order_by function
                        "messages", queryset=Message.objects.order_by("createdAt")
                    )
                )
                .all()
            )

            conversations_response = []

            for convo in conversations:
                convo_dict = {
                    "id": convo.id,
                    "messages": [
                        message.to_dict(["id", "text", "senderId", "createdAt", "isRead"])
                        for message in convo.messages.all()
                    ],
                }

                # set properties for notification count and latest messagelatestMessageText preview
                convo_dict["latestMessageText"] = convo_dict["messages"][len(convo_dict["messages"])-1]["text"]

                # set a property "otherUser" so that frontend will have easier access
                user_fields = ["id", "username", "photoUrl"]
                if convo.user1 and convo.user1.id != user_id:
                    convo_dict["otherUser"] = convo.user1.to_dict(user_fields)
                elif convo.user2 and convo.user2.id != user_id:
                    convo_dict["otherUser"] = convo.user2.to_dict(user_fields)

                # set property for online status of the other user
                if convo_dict["otherUser"]["id"] in online_users:
                    convo_dict["otherUser"]["online"] = True
                else:
                    convo_dict["otherUser"]["online"] = False

                # set property for last read message
                readMessages = [m for m in convo_dict["messages"] if m["senderId"] == user_id and m['isRead']]
                lastReadMessage = None
                if(readMessages):
                    lastReadMessage = readMessages[-1]["id"]
                convo_dict["otherUser"]["lastReadMessage"] = lastReadMessage

                # set property for unread messages
                numOfUnreadMessages = (
                    Message.objects.filter(Q(conversation_id = convo.id) & Q(isRead = False) & ~ Q(senderId = user_id))
                    .count()
                ) 
                convo_dict["numOfUnreadMessages"] = numOfUnreadMessages


                conversations_response.append(convo_dict)
            conversations_response.sort(
                key=lambda convo: convo["messages"][len(convo["messages"])-1]["createdAt"],
                reverse=True,
            )
            return JsonResponse(
                conversations_response,
                safe=False,
            )
        except Exception as e:
            return HttpResponse(status=500)

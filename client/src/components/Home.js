import React, { useCallback, useEffect, useState, useContext } from "react";
import axios from "axios";
import { useHistory } from "react-router-dom";
import { Grid, CssBaseline, Button } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

import { SidebarContainer } from "../components/Sidebar";
import { ActiveChat } from "../components/ActiveChat";
import { SocketContext } from "../context/socket";

const useStyles = makeStyles((theme) => ({
  root: {
    height: "100vh",
  },
}));

const Home = ({ user, logout }) => {
  const history = useHistory();

  const socket = useContext(SocketContext);

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);


  const classes = useStyles();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const addSearchedUsers = (users) => {
    const currentUsers = {};

    // make table of current users so we can lookup faster
    conversations.forEach((convo) => {
      currentUsers[convo.otherUser.id] = true;
    });

    const newState = [...conversations];
    users.forEach((user) => {
      // only create a fake convo if we don't already have a convo with this user
      if (!currentUsers[user.id]) {
        let fakeConvo = { numOfUnreadMessages: 0, otherUser: user, messages: [] };
        newState.push(fakeConvo);
      }
    });

    setConversations(newState);
  };

  const clearSearchedUsers = () => {
    setConversations((prev) => prev.filter((convo) => convo.id));
  };

  const saveMessage = async (body) => {
    const { data } = await axios.post("/api/messages", body);
    return data;
  };

  const sendMessage = (data, body) => {
    socket.emit("new-message", {
      message: data.message,
      recipientId: body.recipientId,
      sender: data.sender,
    });
  };

  const postMessage = async (body) => {
    try {
      const data = await saveMessage(body);

      if (!body.conversationId) {
        addNewConvo(body.recipientId, data.message);
      } else {
        addMessageToConversation(data);
      }

      sendMessage(data, body);
    } catch (error) {
      console.error(error);
    }
  };

  const patchReadMessage = useCallback(async (conversationId, otherUserId) => {
    const reqBody = {
      conversationId: conversationId,
      otherUserId: otherUserId
    };
    await axios.patch("/api/messages", reqBody);
    socket.emit("mark-read", reqBody); 
  }, [socket]);
  

  const addNewConvo = useCallback(
    (recipientId, message) => {
      setConversations(prev => { 
        const index = prev.findIndex((convo) => { 
          return convo.otherUser.id === recipientId;
        });
        if(index > -1) {
          const conversationsCopy = [...prev];
          const convoCopy = conversationsCopy.splice(index,1)[0];
          convoCopy.messages.push(message);
          convoCopy.latestMessageText = message.text;
          convoCopy.id = message.conversationId;
          // move to front of conversations (top of sidebar)
          conversationsCopy.unshift(convoCopy);
          return conversationsCopy;
        }
        return prev;
        
      })
    },
    [],
  );

  const addMessageToConversation = useCallback(
    (data) => {
      // if sender isn't null, that means the message needs to be put in a brand new convo
      if(data['message'].senderId === user.id || data['recipientId'] === user.id) {
        const { message, sender = null } = data;
        if (sender !== null) {
          const newConvo = {
            id: message.conversationId,
            otherUser: sender,
            messages: [message],
            numOfUnreadMessages: 1,
          };
          newConvo.latestMessageText = message.text;
          setConversations((prev) => [newConvo, ...prev]);
        }
      else {
          setConversations((prev) => {
            const index = prev.findIndex((convo) => { 
              return convo.id === message.conversationId;
            });
            // add message to convo, place convo at top of conversations list 
            if(index > -1 && prev[index].id === message.conversationId) {
              const conversationsCopy = [...prev];
              const convoCopy = conversationsCopy.splice(index,1)[0];
              convoCopy.messages.push(message);
              convoCopy.latestMessageText = message.text;
              convoCopy.id = message.conversationId;
              // mark read if they are the reciever and conversation is activeConversation
              if(activeConversation && activeConversation.id === message.conversationId && message.senderId !== user.id) {
                message.isRead = true;
                patchReadMessage(convoCopy.id, convoCopy.otherUser.id);
              }
              else if(message.senderId !== user.id) {
                convoCopy["numOfUnreadMessages"] += 1;
              }
              
              // move to front
              conversationsCopy.unshift(convoCopy);
              return conversationsCopy;
            }
            return prev;
          })
        }
      }
    },
    [activeConversation, user.id, patchReadMessage],
  );

  const addOnlineUser = useCallback((id) => {
    setConversations((prev) =>
      prev.map((convo) => {
        if (convo.otherUser.id === id) {
          const convoCopy = { ...convo };
          convoCopy.otherUser = { ...convoCopy.otherUser, online: true };
          return convoCopy;
        } else {
          return convo;
        }
      }),
    );
  }, []);

  const removeOfflineUser = useCallback((id) => {
    setConversations((prev) =>
      prev.map((convo) => {
        if (convo.otherUser.id === id) {
          const convoCopy = { ...convo };
          convoCopy.otherUser = { ...convoCopy.otherUser, online: false };
          return convoCopy;
        } else {
          return convo;
        }
      }),
    );
  }, []);


  const setActiveChat = useCallback((convo) => {
    setActiveConversation(convo);
    patchReadMessage(convo.id, convo.otherUser.id);
    
  }, [patchReadMessage]);


  /* data parameter expects format
    { lastMessageId: otherUserLastMessage.id,
      conversationId: convo.id,
      otherUserId: convo.otherUser.id }
  */
  const markRead = useCallback((data) => { 
    setConversations( (prev) => {
      return prev.map( (convo) => {
        if(convo.id !== data.conversationId) {
          return convo;
        }
        const convoCopy = { ...convo };
        convoCopy.messages.map( (message) => {
          if(message.senderId === data.otherUserId) {
            if(message.senderId !== user.id && !message.isRead) {
              convoCopy["numOfUnreadMessages"] = 0;
            }
            message.isRead = true;
            if(message.senderId === user.id) {
              convoCopy["otherUser"]["lastReadMessage"] = message.id;
            }
          }
          return message;
        })
        return convoCopy;
      });
    })
  },[user.id])
  

  // Lifecycle

  useEffect(() => {
    // Socket init
    socket.on("add-online-user", addOnlineUser);
    socket.on("remove-offline-user", removeOfflineUser);
    socket.on("new-message", addMessageToConversation);
    socket.on("mark-read", markRead);

    return () => {
      // before the component is destroyed
      // unbind all event handlers used in this component
      socket.off("add-online-user", addOnlineUser);
      socket.off("remove-offline-user", removeOfflineUser);
      socket.off("new-message", addMessageToConversation);
      socket.off("mark-read", markRead);
    };
  }, [addMessageToConversation, addOnlineUser, removeOfflineUser, markRead, socket]);

  useEffect(() => {
    // when fetching, prevent redirect
    if (user?.isFetching) return;

    if (user && user.id) {
      setIsLoggedIn(true);
    } else {
      // If we were previously logged in, redirect to login instead of register
      if (isLoggedIn) history.push("/login");
      else history.push("/register");
    }
  }, [user, history, isLoggedIn]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const { data } = await axios.get("/api/conversations");
        setConversations(data);
      } catch (error) {
        console.error(error);
      }
    };
    if (!user.isFetching) {
      fetchConversations();
    }
  }, [user]);

  const handleLogout = async () => {
    if (user && user.id) {
      await logout(user.id);
    }
  };

  return (
    <>
      <Button onClick={handleLogout}>Logout</Button>
      <Grid container component="main" className={classes.root}>
        <CssBaseline />
        <SidebarContainer
          conversations={conversations}
          user={user}
          clearSearchedUsers={clearSearchedUsers}
          addSearchedUsers={addSearchedUsers}
          setActiveChat={setActiveChat}
        />
        <ActiveChat
          activeConversation={activeConversation}
          conversations={conversations}
          user={user}
          postMessage={postMessage}
        />
      </Grid>
    </>
  );
};

export default Home;

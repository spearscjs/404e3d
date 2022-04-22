import React from "react";
import { Badge, Box, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    justifyContent: "space-between",
    marginLeft: 20,
    flexGrow: 1,
  },
  username: {
    fontWeight: "bold",
    letterSpacing: -0.2,
  },
  previewText: {
    fontSize: 12,
    color: "#9CADC8",
    letterSpacing: -0.17,
  },
  unreadPreviewText: {
    fontSize: 12,
    color: '#000000',
    fontWeight: 600,
    letterSpacing: -0.17,
  },
  unreadBubble: {
    display: 'flex',
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3A8DFF',
    marginRight: 25,
    alignSelf: 'center',
    padding: 7.5,
  },
  hidden: {
    display: 'none'
  },
  bubbleText: {
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: -0.5,
    color: '#FFFFFF',
  },
}));

const ChatContent = ({ conversation }) => {

  const classes = useStyles();
  const { otherUser } = conversation;
  const latestMessageText = conversation.id && conversation.latestMessageText;
  const latestMessageIsRead = conversation.messages.length > 0 && 
      (conversation.messages[conversation.messages.length-1].isRead || 
      conversation.messages[conversation.messages.length-1].senderId !== otherUser.id);
  const numOfUnreadMessages = conversation.numOfUnreadMessages;


  return (
    <Box className={classes.root}>
      <Box>
        <Typography className={classes.username}>
          {otherUser.username}
        </Typography>
        <Typography className={latestMessageIsRead ? classes.previewText : classes.unreadPreviewText}>
          {latestMessageText}
        </Typography>
      </Box>
      <Badge className = {numOfUnreadMessages === 0  ? classes.hidden : classes.unreadBubble }>
        <Typography className={classes.bubbleText}>
          {numOfUnreadMessages}
        </Typography>
      </Badge>
      
    </Box>
  );
};

export default ChatContent;

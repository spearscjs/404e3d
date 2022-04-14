import React from "react";
import { Box, Typography } from "@material-ui/core";
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
    height: 20,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3A8DFF',
    marginRight: 25,
    alignSelf: 'center',
    padding: 7.5,
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
  const numberOfUnreadMessages = conversation.messages.filter(m => m.senderId === otherUser.id && m.isRead === false).length;

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
      <Box className = {classes.unreadBubble} style = {{display: numberOfUnreadMessages === 0  ? 'none' : Box.display}}>
        <Typography className={classes.bubbleText}>
          {numberOfUnreadMessages}
        </Typography>
      </Box>
      
    </Box>
  );
};

export default ChatContent;

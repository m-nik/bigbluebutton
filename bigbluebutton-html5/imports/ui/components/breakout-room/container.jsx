import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import AudioService from '/imports/ui/components/audio/service';
import AudioManager from '/imports/ui/services/audio-manager';
import BreakoutComponent from './component';
import Service from './service';

const BreakoutContainer = props => <BreakoutComponent {...props} />;


export default withTracker((props) => {
  const {
    endAllBreakouts,
    requestJoinURL,
    findBreakouts,
    getBreakoutRoomUrl,
    transferUserToMeeting,
    transferToBreakout,
    meetingId,
    amIModerator,
    closeBreakoutPanel,
    isUserInBreakoutRoom,
  } = Service;

  const breakoutRooms = findBreakouts();
  const isMicrophoneUser = AudioService.isConnected() && !AudioService.isListenOnly();
  const isMeteorConnected = Meteor.status().connected;
  const isReconnecting = AudioService.isReconnecting();
  const {
    setBreakoutAudioTransferStatus,
    getBreakoutAudioTransferStatus,
  } = AudioService;

  return {
    ...props,
    breakoutRooms,
    endAllBreakouts,
    requestJoinURL,
    getBreakoutRoomUrl,
    transferUserToMeeting,
    transferToBreakout,
    isMicrophoneUser,
    meetingId: meetingId(),
    amIModerator: amIModerator(),
    closeBreakoutPanel,
    isMeteorConnected,
    isUserInBreakoutRoom,
    exitAudio: () => AudioManager.exitAudio(),
    isReconnecting,
    setBreakoutAudioTransferStatus,
    getBreakoutAudioTransferStatus,
  };
})(BreakoutContainer);

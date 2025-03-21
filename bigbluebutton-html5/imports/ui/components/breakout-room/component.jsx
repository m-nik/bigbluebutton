import React, { PureComponent } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import _ from 'lodash';
import Button from '/imports/ui/components/button/component';
import { Session } from 'meteor/session';
import logger from '/imports/startup/client/logger';
import { styles } from './styles';
import Service from './service';
import BreakoutRoomContainer from './breakout-remaining-time/container';
import VideoService from '/imports/ui/components/video-provider/service';
import { screenshareHasEnded } from '/imports/ui/components/screenshare/service';
import UserListService from '/imports/ui/components/user-list/service';
import AudioManager from '/imports/ui/services/audio-manager';
import injectWbResizeEvent from '/imports/ui/components/presentation/resize-wrapper/component';

const intlMessages = defineMessages({
  breakoutTitle: {
    id: 'app.createBreakoutRoom.title',
    description: 'breakout title',
  },
  breakoutAriaTitle: {
    id: 'app.createBreakoutRoom.ariaTitle',
    description: 'breakout aria title',
  },
  breakoutDuration: {
    id: 'app.createBreakoutRoom.duration',
    description: 'breakout duration time',
  },
  breakoutRoom: {
    id: 'app.createBreakoutRoom.room',
    description: 'breakout room',
  },
  breakoutJoin: {
    id: 'app.createBreakoutRoom.join',
    description: 'label for join breakout room',
  },
  breakoutJoinAudio: {
    id: 'app.createBreakoutRoom.joinAudio',
    description: 'label for option to transfer audio',
  },
  breakoutReturnAudio: {
    id: 'app.createBreakoutRoom.returnAudio',
    description: 'label for option to return audio',
  },
  generatingURL: {
    id: 'app.createBreakoutRoom.generatingURL',
    description: 'label for generating breakout room url',
  },
  generatedURL: {
    id: 'app.createBreakoutRoom.generatedURL',
    description: 'label for generate breakout room url',
  },
  endAllBreakouts: {
    id: 'app.createBreakoutRoom.endAllBreakouts',
    description: 'Button label to end all breakout rooms',
  },
  alreadyConnected: {
    id: 'app.createBreakoutRoom.alreadyConnected',
    description: 'label for the user that is already connected to breakout room',
  },
});

class BreakoutRoom extends PureComponent {
  static sortById(a, b) {
    if (a.userId > b.userId) {
      return 1;
    }

    if (a.userId < b.userId) {
      return -1;
    }

    return 0;
  }

  constructor(props) {
    super(props);
    this.renderBreakoutRooms = this.renderBreakoutRooms.bind(this);
    this.getBreakoutURL = this.getBreakoutURL.bind(this);
    this.renderDuration = this.renderDuration.bind(this);
    this.transferUserToBreakoutRoom = this.transferUserToBreakoutRoom.bind(this);
    this.renderUserActions = this.renderUserActions.bind(this);
    this.returnBackToMeeeting = this.returnBackToMeeeting.bind(this);
    this.state = {
      requestedBreakoutId: '',
      waiting: false,
      joinedAudioOnly: false,
      breakoutId: '',
    };
  }

  componentDidUpdate() {
    const {
      getBreakoutRoomUrl,
      breakoutRooms,
      closeBreakoutPanel,
      setBreakoutAudioTransferStatus,
      isMicrophoneUser,
      isReconnecting,
    } = this.props;

    const {
      waiting,
      requestedBreakoutId,
      joinedAudioOnly,
    } = this.state;

    if (breakoutRooms.length <= 0) closeBreakoutPanel();

    if (waiting) {
      const breakoutUrlData = getBreakoutRoomUrl(requestedBreakoutId);

      if (!breakoutUrlData) return false;
      if (breakoutUrlData.redirectToHtml5JoinURL !== '') {
        window.open(breakoutUrlData.redirectToHtml5JoinURL, '_blank');
        _.delay(() => this.setState({ waiting: false }), 1000);
      }
    }

    if (joinedAudioOnly && (!isMicrophoneUser || isReconnecting)) {
      this.clearJoinedAudioOnly();
      setBreakoutAudioTransferStatus({
        breakoutMeetingId: '',
        status: AudioManager.BREAKOUT_AUDIO_TRANSFER_STATES.DISCONNECTED,
      });
    }
  }

  getBreakoutURL(breakoutId) {
    Session.set('lastBreakoutOpened', breakoutId);
    const { requestJoinURL, getBreakoutRoomUrl } = this.props;
    const { waiting } = this.state;
    const breakoutRoomUrlData = getBreakoutRoomUrl(breakoutId);
    if (!breakoutRoomUrlData && !waiting) {
      this.setState(
        {
          waiting: true,
          requestedBreakoutId: breakoutId,
        },
        () => requestJoinURL(breakoutId),
      );
    }

    if (breakoutRoomUrlData) {
      window.open(breakoutRoomUrlData.redirectToHtml5JoinURL, '_blank');
      this.setState({ waiting: false });
    }
    return null;
  }

  clearJoinedAudioOnly() {
    this.setState({ joinedAudioOnly: false });
  }

  transferUserToBreakoutRoom(breakoutId) {
    const { transferToBreakout } = this.props;
    transferToBreakout(breakoutId);
    this.setState({ joinedAudioOnly: true, breakoutId });
  }

  returnBackToMeeeting(breakoutId) {
    const { transferUserToMeeting, meetingId } = this.props;
    transferUserToMeeting(breakoutId, meetingId);
    this.setState({ joinedAudioOnly: false, breakoutId });
  }

  renderUserActions(breakoutId, joinedUsers, number) {
    const {
      isMicrophoneUser,
      amIModerator,
      intl,
      isUserInBreakoutRoom,
      exitAudio,
      setBreakoutAudioTransferStatus,
      getBreakoutAudioTransferStatus,
    } = this.props;

    const {
      joinedAudioOnly,
      breakoutId: _stateBreakoutId,
      requestedBreakoutId,
      waiting,
    } = this.state;

    const {
      breakoutMeetingId: currentAudioTransferBreakoutId,
      status,
    } = getBreakoutAudioTransferStatus();

    const isInBreakoutAudioTransfer = status
      === AudioManager.BREAKOUT_AUDIO_TRANSFER_STATES.CONNECTED;

    const stateBreakoutId = _stateBreakoutId || currentAudioTransferBreakoutId;
    const moderatorJoinedAudio = isMicrophoneUser && amIModerator;
    const disable = waiting && requestedBreakoutId !== breakoutId;
    const audioAction = joinedAudioOnly || isInBreakoutAudioTransfer
      ? () => {
        setBreakoutAudioTransferStatus({
          breakoutMeetingId: breakoutId,
          status: AudioManager.BREAKOUT_AUDIO_TRANSFER_STATES.RETURNING,
        });
        this.returnBackToMeeeting(breakoutId);
        return logger.debug({
          logCode: 'breakoutroom_return_main_audio',
          extraInfo: { logType: 'user_action' },
        }, 'Returning to main audio (breakout room audio closed)');
      }
      : () => {
        setBreakoutAudioTransferStatus({
          breakoutMeetingId: breakoutId,
          status: AudioManager.BREAKOUT_AUDIO_TRANSFER_STATES.CONNECTED,
        });
        this.transferUserToBreakoutRoom(breakoutId);
        return logger.debug({
          logCode: 'breakoutroom_join_audio_from_main_room',
          extraInfo: { logType: 'user_action' },
        }, 'joining breakout room audio (main room audio closed)');
      };
    return (
      <div className={styles.breakoutActions}>
        {isUserInBreakoutRoom(joinedUsers)
          ? (
            <span className={styles.alreadyConnected}>
              {intl.formatMessage(intlMessages.alreadyConnected)}
            </span>
          )
          : (
            <Button
              label={intl.formatMessage(intlMessages.breakoutJoin)}
              data-test="breakoutJoin"
              aria-label={`${intl.formatMessage(intlMessages.breakoutJoin)} ${number}`}
              onClick={() => {
                this.getBreakoutURL(breakoutId);
                // leave main room's audio, and stops video and screenshare when joining a breakout room
                exitAudio();
                logger.debug({
                  logCode: 'breakoutroom_join',
                  extraInfo: { logType: 'user_action' },
                }, 'joining breakout room closed audio in the main room');
                VideoService.storeDeviceIds();
                VideoService.exitVideo();
                if (UserListService.amIPresenter()) screenshareHasEnded();
              }
              }
              disabled={disable}
              className={styles.joinButton}
            />
          )
        }
        {
          moderatorJoinedAudio
            ? [
              ('|'),
              (
                <Button
                  label={
                      stateBreakoutId === breakoutId
                        && (joinedAudioOnly || isInBreakoutAudioTransfer)
                        ? intl.formatMessage(intlMessages.breakoutReturnAudio)
                        : intl.formatMessage(intlMessages.breakoutJoinAudio)
                  }
                  className={styles.button}
                  disabled={stateBreakoutId !== breakoutId && joinedAudioOnly}
                  key={`join-audio-${breakoutId}`}
                  onClick={audioAction}
                />
              ),
            ]
            : null
        }
      </div>
    );
  }


  renderBreakoutRooms() {
    const {
      breakoutRooms,
      intl,
    } = this.props;

    const {
      waiting,
      requestedBreakoutId,
    } = this.state;

    const roomItems = breakoutRooms.map(breakout => (
      <div
        className={styles.breakoutItems}
        key={`breakoutRoomItems-${breakout.breakoutId}`}
      >
        <div className={styles.content} key={`breakoutRoomList-${breakout.breakoutId}`}>
          <span aria-hidden>
            {intl.formatMessage(intlMessages.breakoutRoom, { 0: breakout.sequence })}
            <span className={styles.usersAssignedNumberLabel}>
              (
              {breakout.joinedUsers.length}
              )
            </span>
          </span>
          {waiting && requestedBreakoutId === breakout.breakoutId ? (
            <span>
              {intl.formatMessage(intlMessages.generatingURL)}
              <span className={styles.connectingAnimation} />
            </span>
          ) : this.renderUserActions(
            breakout.breakoutId,
            breakout.joinedUsers,
            breakout.sequence.toString(),
          )}
        </div>
        <div className={styles.joinedUserNames}>
          {breakout.joinedUsers
            .sort(BreakoutRoom.sortById)
            .filter((value, idx, arr) => !(value.userId === (arr[idx + 1] || {}).userId))
            .sort(Service.sortUsersByName)
            .map(u => u.name)
            .join(', ')}
        </div>
      </div>
    ));

    return (
      <div className={styles.breakoutColumn}>
        <div className={styles.breakoutScrollableList}>
          {roomItems}
        </div>
      </div>
    );
  }

  renderDuration() {
    const { breakoutRooms } = this.props;
    return (
      <span className={styles.duration}>
        <BreakoutRoomContainer
          messageDuration={intlMessages.breakoutDuration}
          breakoutRoom={breakoutRooms[0]}
        />
      </span>
    );
  }

  render() {
    const {
      isMeteorConnected, intl, endAllBreakouts, amIModerator, closeBreakoutPanel,
    } = this.props;
    return (
      <div className={styles.panel}>
        <Button
          icon="left_arrow"
          label={intl.formatMessage(intlMessages.breakoutTitle)}
          aria-label={intl.formatMessage(intlMessages.breakoutAriaTitle)}
          className={styles.header}
          onClick={closeBreakoutPanel}
        />
        {this.renderBreakoutRooms()}
        {this.renderDuration()}
        {
          amIModerator
            ? (
              <Button
                color="primary"
                disabled={!isMeteorConnected}
                size="lg"
                label={intl.formatMessage(intlMessages.endAllBreakouts)}
                className={styles.endButton}
                onClick={endAllBreakouts}
              />
            ) : null
        }
      </div>
    );
  }
}

export default injectWbResizeEvent(injectIntl(BreakoutRoom));

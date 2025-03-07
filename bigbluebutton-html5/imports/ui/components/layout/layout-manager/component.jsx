import React, { Component, Fragment } from 'react';
import Storage from '/imports/ui/services/storage/session';
import { Session } from 'meteor/session';
import { withLayoutConsumer } from '/imports/ui/components/layout/context';
import { isVideoBroadcasting } from '/imports/ui/components/screenshare/service';
import deviceInfo from '/imports/utils/deviceInfo';
import browserInfo from '/imports/utils/browserInfo';
import _ from 'lodash';

const windowWidth = () => window.innerWidth;
const windowHeight = () => window.innerHeight;
const min = (value1, value2) => (value1 <= value2 ? value1 : value2);
const max = (value1, value2) => (value1 >= value2 ? value1 : value2);

const { isMobile } = deviceInfo;
const { isSafari } = browserInfo;
const FULLSCREEN_CHANGE_EVENT = isSafari ? 'webkitfullscreenchange' : 'fullscreenchange';

// values based on sass file
const USERLIST_MIN_WIDTH = 70;
const USERLIST_MAX_WIDTH = 240;
const CHAT_MIN_WIDTH = 70;
const CHAT_MAX_WIDTH = 400;
const POLL_MIN_WIDTH = 320;
const POLL_MAX_WIDTH = 400;
const NOTE_MIN_WIDTH = 340;
const NOTE_MAX_WIDTH = 800;
const WAITING_MIN_WIDTH = 340;
const WAITING_MAX_WIDTH = 800;
const NAVBAR_HEIGHT = 112;
const LARGE_NAVBAR_HEIGHT = 170;
const ACTIONSBAR_HEIGHT = isMobile ? 50 : 42;
const BREAKOUT_MIN_WIDTH = 320;
const BREAKOUT_MAX_WIDTH = 400;

const WEBCAMSAREA_MIN_PERCENT = 0.2;
const WEBCAMSAREA_MAX_PERCENT = 0.8;
// const PRESENTATIONAREA_MIN_PERCENT = 0.2;
const PRESENTATIONAREA_MIN_WIDTH = 385; // Value based on presentation toolbar
// const PRESENTATIONAREA_MAX_PERCENT = 0.8;
const storageLayoutData = () => Storage.getItem('layoutData');

class LayoutManagerComponent extends Component {
  static calculatesPresentationSize(
    mediaAreaWidth, mediaAreaHeight, presentationSlideWidth, presentationSlideHeight,
  ) {
    let presentationWidth;
    let presentationHeight;
    if (presentationSlideWidth > presentationSlideHeight
      || presentationSlideWidth === presentationSlideHeight) {
      presentationWidth = mediaAreaWidth;
      presentationHeight = (mediaAreaWidth * presentationSlideHeight)
        / presentationSlideWidth;
      // if overflow
      if (presentationHeight > mediaAreaHeight) {
        presentationWidth = (mediaAreaHeight * presentationWidth) / presentationHeight;
        presentationHeight = mediaAreaHeight;
      }
    }
    if (presentationSlideHeight > presentationSlideWidth) {
      presentationWidth = (mediaAreaHeight * presentationSlideWidth)
        / presentationSlideHeight;
      presentationHeight = mediaAreaHeight;
      // if overflow
      if (presentationWidth > mediaAreaWidth) {
        presentationHeight = (mediaAreaWidth * presentationWidth) / presentationHeight;
        presentationWidth = mediaAreaWidth;
      }
    }

    return {
      presentationWidth,
      presentationHeight,
    };
  }

  constructor(props) {
    super(props);

    this.setLayoutSizes = this.setLayoutSizes.bind(this);
    this.calculatesLayout = this.calculatesLayout.bind(this);
  }

  componentDidMount() {
    this._isMounted = true;
    this.setLayoutSizes();
    window.addEventListener('resize', _.throttle(() => this.setLayoutSizes(), 200));

    window.addEventListener('panelChanged', () => {
      this.setLayoutSizes(true);
    });

    window.addEventListener('autoArrangeChanged', () => {
      setTimeout(() => this.setLayoutSizes(false, true), 200);
    });

    window.addEventListener('slideChanged', () => {
      setTimeout(() => this.setLayoutSizes(), 200);
    });

    window.addEventListener('togglePresentationHide', () => {
      setTimeout(() => this.setLayoutSizes(), 200);
    });

    window.addEventListener('webcamAreaResize', () => {
      this.setLayoutSizes();
    });

    window.addEventListener('webcamPlacementChange', () => {
      this.setLayoutSizes(false, false, true);
    });
    
    window.addEventListener(FULLSCREEN_CHANGE_EVENT, () => {
      setTimeout(() => this.setLayoutSizes(), 200);
    });

    window.addEventListener('localeChanged', () => {
      setTimeout(() => this.setLayoutSizes(), 200);
    });
  }

  componentDidUpdate(prevProps) {
    const { layoutContextState, screenIsShared } = this.props;
    const {
      layoutContextState: prevLayoutContextState,
      screenIsShared: prevScreenIsShared
    } = prevProps;
    const {
      numUsersVideo,
    } = layoutContextState;
    const {
      numUsersVideo: prevNumUsersVideo,
    } = prevLayoutContextState;

    if (numUsersVideo !== prevNumUsersVideo
      || prevScreenIsShared !== screenIsShared) {
      setTimeout(() => this.setLayoutSizes(), 500);
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  setLayoutSizes(panelChanged = false, autoarrangeChanged = false, placementChanged = false) {
    const { layoutContextDispatch, layoutContextState } = this.props;
    const { autoArrangeLayout } = layoutContextState;

    if ((autoarrangeChanged && !autoArrangeLayout && !placementChanged) || !this._isMounted) return;

    const layoutSizes = this.calculatesLayout(panelChanged);

    layoutContextDispatch(
      {
        type: 'setWindowSize',
        value: {
          width: windowWidth(),
          height: windowHeight(),
        },
      },
    );
    layoutContextDispatch(
      {
        type: 'setMediaBounds',
        value: {
          width: layoutSizes.mediaBounds.width,
          height: layoutSizes.mediaBounds.height,
          top: layoutSizes.mediaBounds.top,
          left: layoutSizes.mediaBounds.left,
        },
      },
    );
    layoutContextDispatch(
      {
        type: 'setUserListSize',
        value: {
          width: layoutSizes.userListSize.width,
        },
      },
    );
    layoutContextDispatch(
      {
        type: 'setChatSize',
        value: {
          width: layoutSizes.chatSize.width,
        },
      },
    );
    layoutContextDispatch(
      {
        type: 'setPollSize',
        value: {
          width: layoutSizes.pollSize.width,
        },
      },
    );
    layoutContextDispatch(
      {
        type: 'setNoteSize',
        value: {
          width: layoutSizes.noteSize.width,
        },
      },
    );
    layoutContextDispatch(
      {
        type: 'setCaptionsSize',
        value: {
          width: layoutSizes.captionsSize.width,
        },
      },
    );
    layoutContextDispatch(
      {
        type: 'setWaitingUsersPanelSize',
        value: {
          width: layoutSizes.waitingSize.width,
        },
      },
    );
    layoutContextDispatch(
      {
        type: 'setBreakoutRoomSize',
        value: {
          width: layoutSizes.breakoutRoomSize.width,
        },
      },
    );
    layoutContextDispatch(
      {
        type: 'setWebcamsAreaSize',
        value: {
          width: layoutSizes.webcamsAreaSize.width,
          height: layoutSizes.webcamsAreaSize.height,
        },
      },
    );
    layoutContextDispatch(
      {
        type: 'setPresentationAreaSize',
        value: {
          width: layoutSizes.presentationAreaSize.width,
          height: layoutSizes.presentationAreaSize.height,
        },
      },
    );

    const newLayoutData = {
      windowSize: {
        width: windowWidth(),
        height: windowHeight(),
      },
      mediaBounds: {
        width: layoutSizes.mediaBounds.width,
        height: layoutSizes.mediaBounds.height,
        top: layoutSizes.mediaBounds.top,
        left: layoutSizes.mediaBounds.left,
      },
      userListSize: {
        width: layoutSizes.userListSize.width,
      },
      chatSize: {
        width: layoutSizes.chatSize.width,
      },
      pollSize: {
        width: layoutSizes.pollSize.width,
      },
      noteSize: {
        width: layoutSizes.noteSize.width,
      },
      captionsSize: {
        width: layoutSizes.captionsSize.width,
      },
      waitingSize: {
        width: layoutSizes.waitingSize.width,
      },
      breakoutRoomSize: {
        width: layoutSizes.breakoutRoomSize.width,
      },
      webcamsAreaSize: {
        width: layoutSizes.webcamsAreaSize.width,
        height: layoutSizes.webcamsAreaSize.height,
      },
      presentationAreaSize: {
        width: layoutSizes.presentationAreaSize.width,
        height: layoutSizes.presentationAreaSize.height,
      },
    };

    Storage.setItem('layoutData', newLayoutData);
    window.dispatchEvent(new Event('layoutSizesSets'));
  }

  defineWebcamPlacement(mediaAreaWidth, mediaAreaHeight, presentationWidth, presentationHeight) {
    const { layoutContextDispatch, layoutContextState } = this.props;
    const { autoArrangeLayout } = layoutContextState;
    const isScreenShare = isVideoBroadcasting();

    if (!autoArrangeLayout || !this._isMounted) return;

    if (isScreenShare) {
      layoutContextDispatch(
        {
          type: 'setWebcamsPlacement',
          value: 'top',
        },
      );
      Storage.setItem('webcamsPlacement', 'top');
      return;
    }

    if (!isMobile && ((mediaAreaWidth - presentationWidth) > (mediaAreaHeight - presentationHeight))) {
      layoutContextDispatch(
        {
          type: 'setWebcamsPlacement',
          value: 'left',
        },
      );
      Storage.setItem('webcamsPlacement', 'left');
    } else {
      layoutContextDispatch(
        {
          type: 'setWebcamsPlacement',
          value: 'top',
        },
      );
      Storage.setItem('webcamsPlacement', 'top');
    }
  }

  calculatesPanelsSize(panelChanged) {
    const { layoutContextState } = this.props;
    const {
      userListSize: userListSizeContext,
      chatSize: chatSizeContext,
      pollSize: pollSizeContext,
      noteSize: noteSizeContext,
      captionsSize: captionsSizeContext,
      waitingSize: waitingSizeContext,
      breakoutRoomSize: breakoutRoomSizeContext,
    } = layoutContextState;
    const openPanel = Session.get('openPanel');
    const storageLData = storageLayoutData();

    let storageUserListWidth;
    let storageChatWidth;
    let storagePollWidth;
    let storageNoteWidth;
    let storageCaptionsWidth;
    let storageWaitingWidth;
    let storageBreakoutRoomWidth;

    if (storageLData) {
      storageUserListWidth = storageLData.userListSize?.width;
      storageChatWidth = storageLData.chatSize?.width;
      storagePollWidth = storageLData.pollSize?.width;
      storageNoteWidth = storageLData.noteSize?.width;
      storageCaptionsWidth = storageLData.captionsSize?.width;
      storageWaitingWidth = storageLData.waitingSize?.width;
      storageBreakoutRoomWidth = storageLData.breakoutRoomSize?.width;
    }

    let newUserListSize;
    let newChatSize;
    let newPollSize;
    let newNoteSize;
    let newCaptionsSize;
    let newWaitingSize;
    let newBreakoutRoomSize;

    if (panelChanged && userListSizeContext.width !== 0) {
      newUserListSize = userListSizeContext;
    } else if (!storageUserListWidth) {
      newUserListSize = {
        width: min(max((windowWidth() * 0.1), USERLIST_MIN_WIDTH), USERLIST_MAX_WIDTH),
      };
    } else {
      newUserListSize = {
        width: storageUserListWidth,
      };
    }

    if (panelChanged && chatSizeContext.width !== 0) {
      newChatSize = chatSizeContext;
    } else if (!storageChatWidth) {
      newChatSize = {
        width: min(max((windowWidth() * 0.2), CHAT_MIN_WIDTH), CHAT_MAX_WIDTH),
      };
    } else {
      newChatSize = {
        width: storageChatWidth,
      };
    }

    if (panelChanged && pollSizeContext.width !== 0) {
      newPollSize = pollSizeContext;
    } else if (!storagePollWidth) {
      newPollSize = {
        width: min(max((windowWidth() * 0.2), POLL_MIN_WIDTH), POLL_MAX_WIDTH),
      };
    } else {
      newPollSize = {
        width: storagePollWidth,
      };
    }

    if (panelChanged && noteSizeContext.width !== 0) {
      newNoteSize = noteSizeContext;
    } else if (!storageNoteWidth) {
      newNoteSize = {
        width: min(max((windowWidth() * 0.2), NOTE_MIN_WIDTH), NOTE_MAX_WIDTH),
      };
    } else {
      newNoteSize = {
        width: storageNoteWidth,
      };
    }

    if (panelChanged && captionsSizeContext.width !== 0) {
      newCaptionsSize = captionsSizeContext;
    } else if (!storageCaptionsWidth) {
      newCaptionsSize = {
        width: min(max((windowWidth() * 0.2), NOTE_MIN_WIDTH), NOTE_MAX_WIDTH),
      };
    } else {
      newCaptionsSize = {
        width: storageCaptionsWidth,
      };
    }

    if (panelChanged && waitingSizeContext.width !== 0) {
      newWaitingSize = waitingSizeContext;
    } else if (!storageWaitingWidth) {
      newWaitingSize = {
        width: min(max((windowWidth() * 0.2), WAITING_MIN_WIDTH), WAITING_MAX_WIDTH),
      };
    } else {
      newWaitingSize = {
        width: storageWaitingWidth,
      };
    }

    if (panelChanged && breakoutRoomSizeContext.width !== 0) {
      newBreakoutRoomSize = breakoutRoomSizeContext;
    } else if (!storageBreakoutRoomWidth) {
      newBreakoutRoomSize = {
        width: min(max((windowWidth() * 0.2), BREAKOUT_MIN_WIDTH), BREAKOUT_MAX_WIDTH),
      };
    } else {
      newBreakoutRoomSize = {
        width: storageBreakoutRoomWidth,
      };
    }

    switch (openPanel) {
      case 'userlist': {
        newChatSize = {
          width: 0,
        };
        newBreakoutRoomSize = {
          width: 0,
        };
        newPollSize = {
          width: 0,
        };
        newNoteSize = {
          width: 0,
        };
        newCaptionsSize = {
          width: 0,
        };
        newWaitingSize = {
          width: 0,
        };
        break;
      }
      case 'poll': {
        newChatSize = {
          width: 0,
        };
        newNoteSize = {
          width: 0,
        };
        newBreakoutRoomSize = {
          width: 0,
        };
        newCaptionsSize = {
          width: 0,
        };
        newWaitingSize = {
          width: 0,
        };
        break;
      }
      case 'note': {
        newChatSize = {
          width: 0,
        };
        newPollSize = {
          width: 0,
        };
        newBreakoutRoomSize = {
          width: 0,
        };
        newCaptionsSize = {
          width: 0,
        };
        newWaitingSize = {
          width: 0,
        };
        break;
      }
      case 'captions': {
        newChatSize = {
          width: 0,
        };
        newPollSize = {
          width: 0,
        };
        newBreakoutRoomSize = {
          width: 0,
        };
        newNoteSize = {
          width: 0,
        };
        newWaitingSize = {
          width: 0,
        };
        break;
      }
      case 'waitingUsersPanel': {
        newChatSize = {
          width: 0,
        };
        newPollSize = {
          width: 0,
        };
        newBreakoutRoomSize = {
          width: 0,
        };
        newNoteSize = {
          width: 0,
        };
        newCaptionsSize = {
          width: 0,
        };
        break;
      }
      case 'chat': {
        newBreakoutRoomSize = {
          width: 0,
        };
        newPollSize = {
          width: 0,
        };
        newNoteSize = {
          width: 0,
        };
        newCaptionsSize = {
          width: 0,
        };
        newWaitingSize = {
          width: 0,
        };
        break;
      }
      case 'breakoutroom': {
        newChatSize = {
          width: 0,
        };
        newPollSize = {
          width: 0,
        };
        newNoteSize = {
          width: 0,
        };
        newCaptionsSize = {
          width: 0,
        };
        newWaitingSize = {
          width: 0,
        };
        break;
      }
      case '': {
        newUserListSize = {
          width: 0,
        };
        newChatSize = {
          width: 0,
        };
        newBreakoutRoomSize = {
          width: 0,
        };
        newPollSize = {
          width: 0,
        };
        newNoteSize = {
          width: 0,
        };
        newCaptionsSize = {
          width: 0,
        };
        newWaitingSize = {
          width: 0,
        };
        break;
      }
      default: {
        throw new Error('Unexpected openPanel value');
      }
    }

    return {
      newUserListSize,
      newChatSize,
      newPollSize,
      newNoteSize,
      newCaptionsSize,
      newWaitingSize,
      newBreakoutRoomSize,
    };
  }

  calculatesWebcamsAreaSize(
    mediaAreaWidth, mediaAreaHeight, presentationWidth, presentationHeight,
  ) {
    const {
      layoutContextState,
    } = this.props;
    const { webcamsPlacement, numUsersVideo } = layoutContextState;

    const autoArrangeLayout = Storage.getItem('autoArrangeLayout');
    const webcamsAreaUserSetsHeight = Storage.getItem('webcamsAreaUserSetsHeight');
    const webcamsAreaUserSetsWidth = Storage.getItem('webcamsAreaUserSetsWidth');

    let webcamsAreaWidth;
    let webcamsAreaHeight;

    if (numUsersVideo < 1) {
      return {
        webcamsAreaWidth: 0,
        webcamsAreaHeight: 0,
      };
    }

    if (autoArrangeLayout) {
      if (webcamsPlacement === 'left' || webcamsPlacement === 'right') {
        webcamsAreaWidth = (mediaAreaWidth - presentationWidth)
          < (mediaAreaWidth * WEBCAMSAREA_MIN_PERCENT)
          ? mediaAreaWidth * WEBCAMSAREA_MIN_PERCENT
          : mediaAreaWidth - presentationWidth;
        webcamsAreaHeight = mediaAreaHeight;
      } else {
        webcamsAreaWidth = mediaAreaWidth;
        webcamsAreaHeight = (mediaAreaHeight - presentationHeight)
          < (mediaAreaHeight * WEBCAMSAREA_MIN_PERCENT)
          ? mediaAreaHeight * WEBCAMSAREA_MIN_PERCENT
          : mediaAreaHeight - presentationHeight;
      }
    } else if (webcamsPlacement === 'left' || webcamsPlacement === 'right') {
      webcamsAreaWidth = min(
        max(
          webcamsAreaUserSetsWidth
          || mediaAreaWidth * WEBCAMSAREA_MIN_PERCENT,
          mediaAreaWidth * WEBCAMSAREA_MIN_PERCENT,
        ),
        mediaAreaWidth * WEBCAMSAREA_MAX_PERCENT,
      );
      webcamsAreaHeight = mediaAreaHeight;
    } else {
      webcamsAreaWidth = mediaAreaWidth;
      webcamsAreaHeight = min(
        max(
          webcamsAreaUserSetsHeight
          || mediaAreaHeight * WEBCAMSAREA_MIN_PERCENT,
          mediaAreaHeight * WEBCAMSAREA_MIN_PERCENT,
        ),
        mediaAreaHeight * WEBCAMSAREA_MAX_PERCENT,
      );
    }

    if ((webcamsPlacement === 'left' || webcamsPlacement === 'right') && (mediaAreaWidth - webcamsAreaWidth) < PRESENTATIONAREA_MIN_WIDTH) {
      webcamsAreaWidth = mediaAreaWidth - PRESENTATIONAREA_MIN_WIDTH;
    }

    return {
      webcamsAreaWidth,
      webcamsAreaHeight,
    };
  }

  calculatesPresentationAreaSize(
    mediaAreaWidth, mediaAreaHeight, webcamAreaWidth, webcamAreaHeight,
  ) {
    const {
      layoutContextState,
    } = this.props;
    const {
      webcamsPlacement,
      numUsersVideo,
    } = layoutContextState;

    if (numUsersVideo < 1) {
      return {
        presentationAreaWidth: mediaAreaWidth,
        presentationAreaHeight: mediaAreaHeight - 20,
      };
    }

    let presentationAreaWidth;
    let presentationAreaHeight;

    if (webcamsPlacement === 'left' || webcamsPlacement === 'right') {
      presentationAreaWidth = mediaAreaWidth - webcamAreaWidth - 20;
      presentationAreaHeight = mediaAreaHeight - 20;
    } else {
      presentationAreaWidth = mediaAreaWidth;
      presentationAreaHeight = mediaAreaHeight - webcamAreaHeight - 30;
    }

    return {
      presentationAreaWidth,
      presentationAreaHeight,
    };
  }

  calculatesLayout(panelChanged = false) {
    const {
      layoutContextState,
    } = this.props;
    const {
      presentationIsFullscreen,
      presentationSlideSize,
    } = layoutContextState;

    const {
      width: presentationSlideWidth,
      height: presentationSlideHeight,
    } = presentationSlideSize;

    const panelsSize = this.calculatesPanelsSize(panelChanged);

    const {
      newUserListSize,
      newChatSize,
      newPollSize,
      newNoteSize,
      newCaptionsSize,
      newWaitingSize,
      newBreakoutRoomSize,
    } = panelsSize;

    const firstPanel = newUserListSize;

    let secondPanel = {
      width: 0,
    };

    if (newChatSize.width > 0) {
      secondPanel = newChatSize;
    } else if (newPollSize.width > 0) {
      secondPanel = newPollSize;
    } else if (newNoteSize.width > 0) {
      secondPanel = newNoteSize;
    } else if (newCaptionsSize.width > 0) {
      secondPanel = newCaptionsSize;
    } else if (newWaitingSize.width > 0) {
      secondPanel = newWaitingSize;
    } else if (newBreakoutRoomSize.width > 0) {
      secondPanel = newBreakoutRoomSize;
    }

    const isLargeFont = Session.get('isLargeFont');
    const realNavbarHeight = isLargeFont ? LARGE_NAVBAR_HEIGHT : NAVBAR_HEIGHT;

    const mediaAreaHeight = windowHeight() - (realNavbarHeight + ACTIONSBAR_HEIGHT) - 10;
    const mediaAreaWidth = windowWidth() - (firstPanel.width + secondPanel.width);
    const newMediaBounds = {
      width: mediaAreaWidth,
      height: mediaAreaHeight,
      top: realNavbarHeight,
      left: firstPanel.width + secondPanel.width,
    };

    const { presentationWidth, presentationHeight } = LayoutManagerComponent.calculatesPresentationSize(
      mediaAreaWidth, mediaAreaHeight, presentationSlideWidth, presentationSlideHeight,
    );

    this.defineWebcamPlacement(
      mediaAreaWidth, mediaAreaHeight, presentationWidth, presentationHeight,
    );

    const { webcamsAreaWidth, webcamsAreaHeight } = this.calculatesWebcamsAreaSize(
      mediaAreaWidth, mediaAreaHeight, presentationWidth, presentationHeight,
    );

    const newWebcamsAreaSize = {
      width: webcamsAreaWidth,
      height: webcamsAreaHeight,
    };
    let newPresentationAreaSize;
    let newScreenShareAreaSize;
    const { presentationAreaWidth, presentationAreaHeight } = this.calculatesPresentationAreaSize(
      mediaAreaWidth, mediaAreaHeight, webcamsAreaWidth, webcamsAreaHeight,
    );
    if (!presentationIsFullscreen) {
      newPresentationAreaSize = {
        width: presentationAreaWidth || 0,
        height: presentationAreaHeight || 0,
      };
    } else {
      newPresentationAreaSize = {
        width: windowWidth(),
        height: windowHeight(),
      };
    }

    return {
      mediaBounds: newMediaBounds,
      userListSize: newUserListSize,
      chatSize: newChatSize,
      pollSize: newPollSize,
      noteSize: newNoteSize,
      captionsSize: newCaptionsSize,
      waitingSize: newWaitingSize,
      breakoutRoomSize: newBreakoutRoomSize,
      webcamsAreaSize: newWebcamsAreaSize,
      presentationAreaSize: newPresentationAreaSize,
      screenShareAreaSize: newScreenShareAreaSize,
    };
  }

  render() {
    return <Fragment />;
  }
}

export default withLayoutConsumer(LayoutManagerComponent);
export {
  USERLIST_MIN_WIDTH,
  USERLIST_MAX_WIDTH,
  CHAT_MIN_WIDTH,
  CHAT_MAX_WIDTH,
  POLL_MIN_WIDTH,
  POLL_MAX_WIDTH,
  NOTE_MIN_WIDTH,
  NOTE_MAX_WIDTH,
  WAITING_MIN_WIDTH,
  WAITING_MAX_WIDTH,
  NAVBAR_HEIGHT,
  LARGE_NAVBAR_HEIGHT,
  ACTIONSBAR_HEIGHT,
  WEBCAMSAREA_MIN_PERCENT,
  WEBCAMSAREA_MAX_PERCENT,
  PRESENTATIONAREA_MIN_WIDTH,
  BREAKOUT_MIN_WIDTH,
  BREAKOUT_MAX_WIDTH,
};

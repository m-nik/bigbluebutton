import Users from '/imports/api/users';
import Meetings from '/imports/api/meetings';
import Note from '/imports/api/note';
import { makeCall } from '/imports/ui/services/api';
import Auth from '/imports/ui/services/auth';
import Settings from '/imports/ui/services/settings';
import { Session } from 'meteor/session';

const NOTE_CONFIG = Meteor.settings.public.note;
const ROLE_MODERATOR = Meteor.settings.public.user.role_moderator;

const getLang = () => {
  const { locale } = Settings.application;
  return locale ? locale.toLowerCase() : '';
};

const getNoteParams = () => {
  const config = {};
  const User = Users.findOne({ userId: Auth.userID }, { fields: { name: 1 } });
  config.userName = User.name;
  config.lang = getLang();
  config.rtl = document.documentElement.getAttribute('dir') === 'rtl';

  const params = [];
  Object.keys(config).forEach((k) => {
    params.push(`${k}=${encodeURIComponent(config[k])}`);
  });

  return params.join('&');
};

const isLocked = () => {
  const meeting = Meetings.findOne({ meetingId: Auth.meetingID }, { fields: { 'lockSettingsProps.disableNote': 1 } });
  const user = Users.findOne({ userId: Auth.userID }, { fields: { locked: 1, role: 1 } });

  if (meeting.lockSettingsProps && user.role !== ROLE_MODERATOR && user.locked) {
    return meeting.lockSettingsProps.disableNote;
  }
  return false;
};

const getNoteId = () => makeCall('getNoteId');

const buildNoteURL = (noteId) => {
  if (noteId) {
    const params = getNoteParams();
    const url = Auth.authenticateURL(`${NOTE_CONFIG.url}/p/${noteId}?${params}`);
    return url;
  }

  return null;
};

const getRevs = () => {
  const note = Note.findOne({ meetingId: Auth.meetingID }, { fields: { revs: 1 } });
  return note ? note.revs : 0;
};

const getLastRevs = () => {
  const lastRevs = Session.get('noteLastRevs');

  if (!lastRevs) return -1;
  return lastRevs;
};

const setLastRevs = () => {
  const revs = getRevs();
  const lastRevs = getLastRevs();

  if (revs !== 0 && revs > lastRevs) {
    Session.set('noteLastRevs', revs);
  }
};

const isPanelOpened = () => Session.get('openPanel') === 'note';

const hasUnreadNotes = () => {
  const opened = isPanelOpened();
  if (opened) return false;

  const revs = getRevs();
  const lastRevs = getLastRevs();

  return (revs !== 0 && revs > lastRevs);
};

const isEnabled = () => {
  const note = Note.findOne({ meetingId: Auth.meetingID });
  return NOTE_CONFIG.enabled && note;
};

const toggleNotePanel = () => {
  Session.set(
    'openPanel',
    isPanelOpened() ? 'userlist' : 'note',
  );
  window.dispatchEvent(new Event('panelChanged'));
};

export default {
  getNoteId,
  buildNoteURL,
  toggleNotePanel,
  isLocked,
  isEnabled,
  isPanelOpened,
  getRevs,
  setLastRevs,
  getLastRevs,
  hasUnreadNotes,
};

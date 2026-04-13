import User from './User';
import Event from './Event';
import News from './News';
import Gallery from './Gallery';
import Photo from './Photo';
import Connection from './Connection';
import Message from './Message';
import Payment from './Payment';
import Comment from './Comment';
import EventAttendee from './EventAttendee';
import NewsLike from './NewsLike';
import PhotoLike from './PhotoLike';

User.hasMany(Event, { foreignKey: 'organizerId', as: 'events' });
Event.belongsTo(User, { foreignKey: 'organizerId', as: 'organizer' });

User.hasMany(News, { foreignKey: 'authorId', as: 'news' });
News.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

User.hasMany(Gallery, { foreignKey: 'ownerId', as: 'galleries' });
Gallery.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

Gallery.hasMany(Photo, { foreignKey: 'galleryId', as: 'photos' });
Photo.belongsTo(Gallery, { foreignKey: 'galleryId', as: 'gallery' });

User.hasMany(Photo, { foreignKey: 'uploadedBy', as: 'uploadedPhotos' });
Photo.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });

Event.belongsToMany(User, { through: EventAttendee, foreignKey: 'eventId', as: 'attendees' });
User.belongsToMany(Event, { through: EventAttendee, foreignKey: 'userId', as: 'registeredEvents' });

News.belongsToMany(User, { through: NewsLike, foreignKey: 'newsId', as: 'likedBy' });
User.belongsToMany(News, { through: NewsLike, foreignKey: 'userId', as: 'likedNews' });

Photo.belongsToMany(User, { through: PhotoLike, foreignKey: 'photoId', as: 'likedBy' });
User.belongsToMany(Photo, { through: PhotoLike, foreignKey: 'userId', as: 'likedPhotos' });

User.belongsToMany(User, {
  through: Connection,
  as: 'sentRequests',
  foreignKey: 'requesterId',
});
User.belongsToMany(User, {
  through: Connection,
  as: 'receivedRequests',
  foreignKey: 'recipientId',
});

Connection.belongsTo(User, { foreignKey: 'requesterId', as: 'requester' });
Connection.belongsTo(User, { foreignKey: 'recipientId', as: 'recipient' });

User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
User.hasMany(Message, { foreignKey: 'recipientId', as: 'receivedMessages' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
Message.belongsTo(User, { foreignKey: 'recipientId', as: 'recipient' });

User.hasMany(Payment, { foreignKey: 'userId', as: 'payments' });
Event.hasMany(Payment, { foreignKey: 'eventId', as: 'payments' });
Payment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Payment.belongsTo(Event, { foreignKey: 'eventId', as: 'event' });

User.hasMany(Comment, { foreignKey: 'authorId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

export {
  User,
  Event,
  News,
  Gallery,
  Photo,
  Connection,
  Message,
  Payment,
  Comment,
  EventAttendee,
  NewsLike,
  PhotoLike,
};

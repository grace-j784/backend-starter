import FriendConcept from "./concepts/friend";
import PostConcept from "./concepts/post";
import UserConcept from "./concepts/user";
import WebSessionConcept from "./concepts/websession";

import FeatureConcept from "./concepts/feature";
import SaveConcept from "./concepts/savour";
import TagConcept from "./concepts/tag";

// App Definition using concepts
export const WebSession = new WebSessionConcept();
export const User = new UserConcept();
export const Post = new PostConcept();
export const Friend = new FriendConcept();
export const Tag = new TagConcept();
export const Save = new SaveConcept();
export const Feature = new FeatureConcept();

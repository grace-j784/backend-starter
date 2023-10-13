import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Post, Save, Tag, User, WebSession } from "./app";
import { PostDoc, PostOptions } from "./concepts/post";
import { UserDoc } from "./concepts/user";
import { WebSessionDoc } from "./concepts/websession";
import Responses from "./responses";

class Routes {
  @Router.get("/session")
  async getSessionUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.getUserById(user);
  }

  @Router.get("/users")
  async getUsers() {
    return await User.getUsers();
  }

  @Router.get("/users/:username")
  async getUser(username: string) {
    return await User.getUserByUsername(username);
  }

  @Router.post("/users")
  async createUser(session: WebSessionDoc, username: string, password: string) {
    WebSession.isLoggedOut(session);
    return await User.create(username, password);
  }

  @Router.patch("/users")
  async updateUser(session: WebSessionDoc, update: Partial<UserDoc>) {
    const user = WebSession.getUser(session);
    return await User.update(user, update);
  }

  @Router.delete("/users")
  async deleteUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    WebSession.end(session);
    return await User.delete(user);
  }

  @Router.post("/login")
  async logIn(session: WebSessionDoc, username: string, password: string) {
    const u = await User.authenticate(username, password);
    WebSession.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: WebSessionDoc) {
    WebSession.end(session);
    return { msg: "Logged out!" };
  }

  @Router.get("/posts")
  async getPosts(author?: string) {
    let posts;
    if (author) {
      const id = (await User.getUserByUsername(author))._id;
      posts = await Post.getByAuthor(id);
    } else {
      posts = await Post.getPosts({});
    }
    return Responses.posts(posts);
  }

  @Router.post("/posts")
  async createPost(session: WebSessionDoc, content: string, options?: PostOptions) {
    const user = WebSession.getUser(session);
    const created = await Post.create(user, content, options);
    return { msg: created.msg, post: await Responses.post(created.post) };
  }

  @Router.patch("/posts/:_id")
  async updatePost(session: WebSessionDoc, _id: ObjectId, update: Partial<PostDoc>) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    return await Post.update(_id, update);
  }

  @Router.delete("/posts/:_id")
  async deletePost(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    return Post.delete(_id);
  }

  /* @Router.get("/friends")
  async getFriends(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.idsToUsernames(await Friend.getFriends(user));
  }

  @Router.delete("/friends/:friend")
  async removeFriend(session: WebSessionDoc, friend: string) {
    const user = WebSession.getUser(session);
    const friendId = (await User.getUserByUsername(friend))._id;
    return await Friend.removeFriend(user, friendId);
  }

  @Router.get("/friend/requests")
  async getRequests(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Responses.friendRequests(await Friend.getRequests(user));
  }

  @Router.post("/friend/requests/:to")
  async sendFriendRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Friend.sendRequest(user, toId);
  }

  @Router.delete("/friend/requests/:to")
  async removeFriendRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Friend.removeRequest(user, toId);
  }

  @Router.put("/friend/accept/:from")
  async acceptFriendRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Friend.acceptRequest(fromId, user);
  }

  @Router.put("/friend/reject/:from")
  async rejectFriendRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Friend.rejectRequest(fromId, user);
  } */

  @Router.post("/tags")
  async createTag(name: string) {
    const created = await Tag.create(name, true);
    return { msg: created.msg, tag: name };
  }

  @Router.get("/tags")
  async getTags() {
    //let tags;
    //if (author) {
    //  const id = (await User.getUserByUsername(author))._id;
    //  posts = await Post.getByAuthor(id);
    //} else {
    //  posts = await Post.getPosts({});
    //}
    return await Tag.getTags({});
  }

  @Router.post("/tags/:post")
  async addPublicTag(session: WebSessionDoc, make_public: string, post_id: ObjectId, tag_id: ObjectId) {
    const user = WebSession.getUser(session);
    if (make_public === "yes") {
      await Post.isAuthor(user, post_id);
      return await Tag.addTagToPost(post_id, tag_id, user, false);
    } else {
      return await Tag.addTagToPost(post_id, tag_id, user, true);
    }
  }

  @Router.get("/tags/:id")
  async getTaggedPosts(tag_type: string, tag_id?: ObjectId) {
    let privacy;
    if (tag_type === "private") {
      privacy = true;
    } else if (tag_type === "public") {
      privacy = false;
    } else {
      return { msg: "Invalid tag_type input, please input private or public" };
    }
    let tagged_posts;
    if (tag_id) {
      tagged_posts = await Tag.getTaggedPosts({ tag_id: tag_id, is_private: privacy });
    } else {
      tagged_posts = await Tag.getTaggedPosts({ is_private: privacy });
    }
    return tagged_posts;
  }

  @Router.delete("/tags/:id")
  async removeTagFromPost(session: WebSessionDoc, tag_id: ObjectId, post_id: ObjectId) {
    const user = WebSession.getUser(session);
    return await Tag.removeTaggedByAuthor(user, tag_id, post_id);
  }

  @Router.get("/saves")
  async getSavedPosts(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Save.getSaved({ save_author: user });
  }

  @Router.post("/saves/:id")
  async savePost(session: WebSessionDoc, post_id: ObjectId, options?: PostOptions) {
    const user = WebSession.getUser(session);
    return await Save.save(user, post_id, options);
  }

  @Router.delete("/saves/:id")
  async unsavePost(session: WebSessionDoc, save_id: ObjectId) {
    const user = WebSession.getUser(session);
    await Save.isSaveAuthor(user, save_id);
    return await Save.unsave(user, save_id);
  }

  @Router.post("/notes/:id")
  async createNote(session: WebSessionDoc, post_id: ObjectId) {
    throw Error("not implemented yet");
  }

  @Router.put("/notes/:id")
  async editNote(session: WebSessionDoc, note_id: ObjectId) {
    throw Error("not implemented yet");
  }

  @Router.delete("/notes/:id")
  async deleteNote(session: WebSessionDoc, note_id: ObjectId) {
    throw Error("not implemented yet");
  }

  @Router.get("/match")
  async findPosts(query: Set<string>) {
    throw Error("not implemented yet");
  }

  @Router.get("/feature")
  async getFeatured() {
    throw Error("not implemented yet");
  }

  @Router.post("/feature")
  async feature(session: WebSessionDoc, post_id: ObjectId) {
    throw Error("not implemented yet");
  }

  @Router.delete("/feature")
  async unfeature(session: WebSessionDoc, post_id: ObjectId) {
    throw Error("not implemented yet");
  }

  @Router.post("/feature")
  async setTheme(theme: string) {
    throw Error("not implemented yet");
  }
}

export default getExpressRouter(new Routes());

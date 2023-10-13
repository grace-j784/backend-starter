import { Filter, ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

//export interface PostOptions {
//  backgroundColor?: string;
//}

export interface TagDoc extends BaseDoc {
  name: string;
  isPublic: boolean;
}

export interface TaggedPostDoc extends BaseDoc {
  tag_id: ObjectId;
  post_id: ObjectId;
  author: ObjectId;
  is_private: boolean;
}

export default class TagConcept {
  public readonly tags = new DocCollection<TagDoc>("tags");
  public readonly tagged = new DocCollection<TaggedPostDoc>("tagged");

  async create(name: string, isPublic: boolean) {
    const _id = await this.tags.createOne({ name, isPublic });
    return { msg: "Tag successfully created!", post: await this.tags.readOne({ _id }) };
  }

  async addTagToPost(post_id: ObjectId, tag_id: ObjectId, author: ObjectId, is_private: boolean) {
    await this.tagged.createOne({ tag_id, post_id, author, is_private });
    if (is_private) {
      return { msg: "Private tag successfully added to post!" };
    } else {
      return { msg: "Public tag successfully added to post!" };
    }
  }

  async getTags(query: Filter<TagDoc>) {
    const posts = await this.tags.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    //await this.tags.deleteMany({});
    return posts;
  }

  async getById(_id: ObjectId) {
    const tag = await this.tags.readOne({ _id });
    if (!tag) {
      throw new NotFoundError(`Tag ${_id} does not exist!`);
    }
    return tag;
  }

  //async getTags(query: Filter<TagDoc>) {
  //  const tags = await this.tags.readMany(query, {
  //    sort: { dateUpdated: -1 },
  //  });
  //  return tags;
  //}

  async removeTaggedByAuthor(user: ObjectId, tag_id: ObjectId, post_id: ObjectId) {
    const tag_assigns = await this.tagged.readMany({ tag_id, post_id, author: user });
    if (tag_assigns.length === 0) {
      throw new NotFoundError(`Tag ${tag_id} on post ${post_id} does not exist, or you are not the author of this tag assignment!`);
    }
    for (const tag_assign of tag_assigns) {
      return await this.remove(tag_assign._id);
    }
  }

  async remove(_id: ObjectId) {
    await this.tagged.deleteOne({ _id });
    return { msg: "Tag successfully removed from post!" };
  }

  async getTaggedPosts(query: Filter<TaggedPostDoc>) {
    // temporarily implementing a version that works for searching up just one tag
    //return await this.getTags({ tag });
    const tagged_posts = await this.tagged.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return tagged_posts;
  }
}

export class AuthorNotMatchError extends NotAllowedError {
  constructor(
    public readonly author: ObjectId,
    public readonly tag_id: ObjectId,
    public readonly post_id: ObjectId,
  ) {
    super("{0} is not the author of tag assignment from tag {1} to post {2}!", author, tag_id, post_id);
  }
}

import { Filter, ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface PostOptions {
  backgroundColor?: string;
}

export interface SaveDoc extends BaseDoc {
  save_author: ObjectId;
  source_post_id: ObjectId;
  //title: string;
  //content: string;
  options?: PostOptions;
}

export default class SaveConcept {
  public readonly saved = new DocCollection<SaveDoc>("saved");

  async save(save_author: ObjectId, source_post_id: ObjectId, options?: PostOptions) {
    const _id = await this.saved.createOne({ save_author, source_post_id, options });
    return { msg: "Post saved successfully!", post: await this.saved.readOne({ _id }) };
  }

  async getSaved(query: Filter<SaveDoc>) {
    const saved = await this.saved.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return saved;
  }

  async unsave(save_author: ObjectId, save_id: ObjectId) {
    await this.saved.deleteOne({ _id: save_id });
    return { msg: "Post unsaved successfully!" };
  }

  async isSaveAuthor(user: ObjectId, save_id: ObjectId) {
    const _id = save_id;
    const save = await this.saved.readOne({ _id });
    if (!save) {
      throw new NotFoundError(`Post ${_id} does not exist in save records!`);
    }
    if (save.save_author.toString() !== user.toString()) {
      throw new SaveAuthorNotMatchError(user, _id);
    }
  }
}

export class SaveAuthorNotMatchError extends NotAllowedError {
  constructor(
    public readonly author: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the save author of post {1}!", author, _id);
  }
}

import { Filter, ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";

export interface PostOptions {
  backgroundColor?: string;
}

export interface FeatureDoc extends BaseDoc {
  post_id: ObjectId;
  //theme?
}

export default class FeatureConcept {
  public readonly featured = new DocCollection<FeatureDoc>("featured");

  async feature(post_id: ObjectId) {
    const _id = await this.featured.createOne({ post_id });
    return { msg: "Post successfully added to featured!", post: await this.featured.readOne({ _id }) };
  }

  async getFeatured(query: Filter<FeatureDoc>) {
    const featured = await this.featured.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return featured;
  }

  async unfeature(_id: ObjectId) {
    await this.featured.deleteOne({ _id });
    return { msg: "Post successfully unfeatured!" };
  }
}

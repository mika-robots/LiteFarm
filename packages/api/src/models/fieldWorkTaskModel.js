/*
 *  Copyright (C) 2007 Free Software Foundation, Inc. <https://fsf.org/>
 *  This file (fieldWorkLogModel.js) is part of LiteFarm.
 *
 *  LiteFarm is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  LiteFarm is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details, see <https://www.gnu.org/licenses/>.
 */

import { Model } from 'objection';
import taskModel from './taskModel.js';

class FieldWorkTaskModel extends Model {
  static get tableName() {
    return 'field_work_task';
  }

  static get idColumn() {
    return 'task_id';
  }
  // Optional JSON schema. This is not the database schema! Nothing is generated
  // based on this. This is only used for validation. Whenever a model instance
  // is created it is checked against this schema. http://json-schema.org/.
  static get jsonSchema() {
    return {
      type: 'object',

      properties: {
        task_id: { type: 'integer' },
        type: {
          type: 'string',
          enum: [
            'COVERING_SOIL',
            'FENCING',
            'PREPARING_BEDS_OR_ROWS',
            'PRUNING',
            'SHADE_CLOTH',
            'TERMINATION',
            'TILLAGE',
            'WEEDING',
            'OTHER',
          ],
        },
        other_type: { type: ['string', null] },
      },
      additionalProperties: false,
    };
  }

  static get relationMappings() {
    // Import models here to prevent require loops.
    return {
      task: {
        relation: Model.BelongsToOneRelation,
        // The related model. This can be either a Model
        // subclass constructor or an absolute file path
        // to a module that exports one.
        modelClass: taskModel,
        join: {
          from: 'field_work_task.task_id',
          to: 'task.task_id',
        },
      },
    };
  }
}

export default FieldWorkTaskModel;

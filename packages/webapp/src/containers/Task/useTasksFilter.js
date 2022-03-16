import { createSelector } from 'reselect';
import moment from 'moment';

import { sortTaskCardContent, taskCardContentSelector } from './taskCardContentSelector';
import { tasksFilterSelector } from '../filterSlice';
import {
  ASSIGNEE,
  CROP,
  FROM_DATE,
  IS_ASCENDING,
  LOCATION,
  STATUS,
  TO_DATE,
  TYPE,
} from '../Filter/constants';

const getActiveCriteria = (filter) => {
  const filterKeys = Object.keys(filter);
  const countActive = filterKeys.filter((k) => filter[k].active).length;
  let selected = [];

  if (countActive > 0) selected = filterKeys.filter((key) => filter[key].active);
  else selected = filterKeys;

  return new Set(selected);
};

const filterByAssignee = (task, activeAssignees) => {
  let user_id = 'unassigned';
  if (task.assignee !== undefined) {
    user_id = task.assignee.user_id;
  }
  return activeAssignees.has(user_id);
};

const filterByFromDate = (task, fromDate) => {
  if (fromDate === undefined) {
    return true;
  }

  return moment(task.completeOrDueDate).isSameOrAfter(fromDate, 'day');
};

const filterByToDate = (task, toDate) => {
  if (toDate === undefined) {
    return true;
  }

  return moment(task.completeOrDueDate).isSameOrBefore(toDate, 'day');
};

function filterTasks(tasks, filters) {
  const activeStatus = getActiveCriteria(filters[STATUS]);
  const activeTypes = getActiveCriteria(filters[TYPE]);
  const activeLocations = getActiveCriteria(filters[LOCATION]);
  const activeAssignees = getActiveCriteria(filters[ASSIGNEE]);
  const activeVarieties = getActiveCriteria(filters[CROP]);
  const filteredTasks = tasks
    .filter((t) => !activeStatus.size || activeStatus.has(t.status))
    .filter((t) => !activeTypes.size || activeTypes.has(t.taskType.task_type_id.toString()))
    .filter((t) => !activeLocations.size || activeLocations.has(t.locationName))
    .filter((t) => !activeVarieties.size || activeVarieties.has(t.cropVarietyName))
    .filter((t) => !activeAssignees.size || filterByAssignee(t, activeAssignees))
    .filter((t) => filterByFromDate(t, filters[FROM_DATE]))
    .filter((t) => filterByToDate(t, filters[TO_DATE]));
  return sortTaskCardContent(filteredTasks, filters[IS_ASCENDING]);
}

export const filteredTaskCardContentSelector = createSelector(
  [taskCardContentSelector, tasksFilterSelector],
  filterTasks,
);

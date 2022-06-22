/*
 *  Copyright (C) 2007 Free Software Foundation, Inc. <https://fsf.org/>
 *  This file (saga.js) is part of LiteFarm.
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

import { createAction } from '@reduxjs/toolkit';
import { call, put, select, takeLeading } from 'redux-saga/effects';
import { url, sensorUrl } from '../../apiConfig';
import i18n from '../../locales/i18n';
import { axios, getHeader } from '../saga';
import { loginSelector, userFarmSelector } from '../userFarmSlice';
import { canShowSuccessHeader, setSuccessMessage } from '../../containers/mapSlice';
import {
  patchSpotlightFlagsFailure,
  patchSpotlightFlagsSuccess,
  spotlightLoading,
} from '../showedSpotlightSlice';
import {
  bulkSensorsUploadFailure,
  bulkSensorsUploadSuccess,
  bulkSensorsUploadLoading,
} from '../bulkSensorUploadSlice';

import { enqueueErrorSnackbar } from '../Snackbar/snackbarSlice';

const sendMapToEmailUrl = (farm_id) => `${url}/export/map/farm/${farm_id}`;
const showedSpotlightUrl = () => `${url}/showed_spotlight`;
const bulkUploadSensorsInfoUrl = () => `${sensorUrl}/add_sensors`;

export const sendMapToEmail = createAction(`sendMapToEmailSaga`);

export function* sendMapToEmailSaga({ payload: fileDataURL }) {
  try {
    const { farm_name } = yield select(userFarmSelector);
    const formData = new FormData();
    const fileFetchRes = yield call(fetch, fileDataURL);
    const fileBuffer = yield fileFetchRes.arrayBuffer();
    const file = new File([fileBuffer], `${farm_name}-export-${new Date().toISOString()}.png`, {
      type: 'image/png',
    });
    formData.append('_file_', file);
    const { farm_id } = yield select(userFarmSelector);
    yield call(axios.post, sendMapToEmailUrl(farm_id), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: 'Bearer ' + localStorage.getItem('id_token'),
      },
    });
  } catch (e) {
    yield put(enqueueErrorSnackbar(i18n.t('message:ATTACHMENTS.ERROR.FAILED_UPLOAD')));
    console.log(e);
  }
}

export const setSpotlightToShown = createAction(`setSpotlightToShownSaga`);

export function* setSpotlightToShownSaga({ payload: spotlights }) {
  try {
    const { user_id } = yield select(loginSelector);
    const header = getHeader(user_id);
    let patchContent = {};
    if (typeof spotlights == 'string') {
      spotlights = [spotlights];
    }
    for (const spotlight of spotlights) {
      patchContent[spotlight] = true;
      patchContent[`${spotlight}_end`] = new Date().toISOString();
      yield put(spotlightLoading());
      yield put(patchSpotlightFlagsSuccess({ [spotlight]: true }));
    }
    yield call(axios.patch, showedSpotlightUrl(), patchContent, header);
  } catch (error) {
    yield put(patchSpotlightFlagsFailure());
    console.log('failed to patch spotlight flags');
  }
}

export const bulkUploadSensorsInfoFile = createAction(`bulkUploadSensorsInfoFileSaga`);

export function* bulkUploadSensorsInfoFileSaga({ payload: { file } }) {
  try {
    yield put(bulkSensorsUploadLoading());
    const { farm_id } = yield select(userFarmSelector);
    const formData = new FormData();
    formData.append('sensors', file);
    const fileUploadResponse = yield call(axios.post, bulkUploadSensorsInfoUrl(), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: 'Bearer ' + localStorage.getItem('id_token'),
        farm_id: farm_id,
      },
    });

    if (fileUploadResponse.status === 200) {
      fileUploadResponse.data;
      yield put(bulkSensorsUploadSuccess());
      yield put(
        setSuccessMessage([
          i18n.t('FARM_MAP.MAP_FILTER.SENSOR'),
          i18n.t('message:MAP.SUCCESS_UPLOAD'),
        ]),
      );
      yield put(canShowSuccessHeader(true));
      return;
    }
    yield put(bulkSensorsUploadFailure());
    yield put(enqueueErrorSnackbar(i18n.t('message:BULK_UPLOAD.ERROR.UPLOAD')));
  } catch (e) {
    yield put(bulkSensorsUploadFailure());
    yield put(enqueueErrorSnackbar(i18n.t('message:BULK_UPLOAD.ERROR.UPLOAD')));
    console.log(e);
  }
}

export default function* supportSaga() {
  yield takeLeading(sendMapToEmail.type, sendMapToEmailSaga);
  yield takeLeading(setSpotlightToShown.type, setSpotlightToShownSaga);
  yield takeLeading(bulkUploadSensorsInfoFile.type, bulkUploadSensorsInfoFileSaga);
}

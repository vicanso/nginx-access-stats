/* lodash/sortedIndex */
function sortedIndex(array, value) {
  let low = 0;
  let high = array == null ? low : array.length;

  while (low < high) {
    /* eslint no-bitwise:0 */
    const mid = (low + high) >>> 1;
    const computed = array[mid];
    if (computed !== null && computed < value) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return high;
}

function getSpdy(v) {
  const index = sortedIndex([100, 300, 1000, 3000], v);
  return `${index}`;
}

function analyse(log) {
  const tmpArr = log.trim().split('"');
  const arr = [];
  tmpArr.forEach((v, index) => {
    const str = v.trim();
    // via hader log
    if (index === 5) {
      arr.push(str);
    } else if (str) {
      arr.push(...str.split(' '));
    }
  });
  /* istanbul ignore if */
  if (arr.length < 14) {
    return null;
  }
  const [
    ,
    ,
    ip,
    track,
    responseId,
    method,
    url,
    ,
    status,
    bytes,
    responseTime,
    requestTime,
    referrer,
    via,
  ] = arr;
  const result = {
    ip,
    url,
    method,
    status: Number.parseInt(status, 10),
    type: status.charAt(0),
    bytes: Number.parseInt(bytes, 10),
    requestTime: Number.parseFloat(requestTime),
    responseTime: Number.parseFloat(responseTime),
  };
  result.spdy = getSpdy(result.requestTime);
  /* istanbul ignore else */
  if (track && track !== '-') {
    result.track = track;
  }
  /* istanbul ignore else */
  if (responseId && responseId !== '-') {
    result.responseId = responseId;
  }
  /* istanbul ignore else */
  if (referrer && referrer !== '-') {
    result.referrer = referrer;
  }
  if (via && via !== '-') {
    result.via = via;
  }
  return result;
}

module.exports = analyse;

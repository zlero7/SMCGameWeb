const xlsx = require('./backend/node_modules/xlsx');

// 시트 생성 (헤더 + 데이터)
const ws = xlsx.utils.aoa_to_sheet([
  ['UserName', 'password', 'name', 'role'],
  ['test001', 'pass1234', '테스트학생1', 'student'],
  ['test002', 'pass1234', '테스트학생2', 'student'],
  ['admin01', 'admin123', '테스트관리자', 'admin']
]);

const wb = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');
xlsx.writeFile(wb, './UserInfo.xlsx');
console.log('Excel 파일 생성 완료');
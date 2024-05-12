const requiredMessage: { [key: string]: any } = {
  project: {
    userId: '請輸入用戶id',
    teamName: '請輸入提案人名稱/團隊名稱',
    email: '請輸入聯絡信箱',
    phone: '請輸入聯絡手機',
    title: '請輸入提案標題',
    categoryKey: '請選擇提案分類',
    targetMoney: '請輸入提案目標',
    startDate: '請輸入提案開始日期',
    endDate: '請輸入提案截止日期',
    describe: '請輸入提案簡介',
    coverUrl: '請上傳封面',
    content: '請輸入內容'
  },
  payment: {
    projectId: '請輸入提案id',
    money: '請輸入贊助金額',
    userName: '請輸入贊助者名稱',
    phone: '請輸入贊助者聯絡電話',
    isNeedFeedback: '是否需要回饋品',
    receiver: '請輸入收件人名稱',
    receiverPhone: '請輸入收件人電話',
    address: '請輸入收件地址'
  }
}

export default requiredMessage

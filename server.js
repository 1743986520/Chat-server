// chat-server.js - 聊天服务器代码
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// 简单内存存储（实际应用中应使用数据库）
const messages = new Map();

// 清理旧消息（5分钟）
setInterval(() => {
  const now = Date.now();
  for (const [roomId, roomMessages] of messages) {
    const filtered = roomMessages.filter(msg => now - msg.timestamp < 5 * 60 * 1000);
    if (filtered.length > 0) {
      messages.set(roomId, filtered);
    } else {
      messages.delete(roomId);
    }
  }
}, 60 * 1000); // 每分钟清理一次

// 接收消息片段
app.post('/message-part', (req, res) => {
  const { roomId, sender, part, index, total } = req.body;
  
  if (!roomId || !sender || part === undefined || index === undefined || total === undefined) {
    return res.status(400).json({ error: '缺少必要参数' });
  }
  
  try {
    // 初始化房间消息存储
    if (!messages.has(roomId)) {
      messages.set(roomId, {
        parts: Array(total).fill(null),
        lastUpdated: Date.now()
      });
    }
    
    const roomData = messages.get(roomId);
    roomData.parts[index] = part;
    roomData.lastUpdated = Date.now();
    
    // 检查是否所有部分都已接收
    if (roomData.parts.every(p => p !== null)) {
      const fullMessage = {
        roomId,
        sender,
        message: roomData.parts.join(''),
        timestamp: Date.now()
      };
      
      // 这里可以添加消息广播逻辑（如果需要）
      console.log('完整消息:', fullMessage);
      
      // 清理已完成的片段
      messages.delete(roomId);
    }
    
    res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('消息处理错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 心跳检测
app.get('/ping', (req, res) => {
  res.send('OK');
});

// 获取服务器状态
app.get('/status', (req, res) => {
  res.json({
    status: 'running',
    activeRooms: messages.size,
    memoryUsage: process.memoryUsage()
  });
});

app.listen(port, () => {
  console.log(`聊天服务器运行在端口 ${port}`);
});

# WORD CLOUD · 贴纸式背单词 Web App

一个移动端优先的贴纸风格英语词汇学习应用，使用原生 HTML、CSS 和 JavaScript，无需构建步骤，可直接部署为静态网站。

## 功能

- 贴纸式词云：随机排列、旋转贴纸和轻量动画
- 单词卡片：释义、音标、例句和中文翻译（按词条提供）
- 主动回忆：根据中文释义拼写英文，提供即时反馈
- 记忆进度：连续三次回忆正确即可收入已掌握贴纸墙
- 词库管理：搜索、筛选、手动添加单词
- 导入词表：支持 CSV、TXT、JSON
- 数据备份：导出 JSON
- 本地保存：使用浏览器 localStorage 保存学习记录
- 手机、平板和桌面端响应式布局

## 本地运行

直接使用现代浏览器打开 `index.html`，或运行：

```bash
python -m http.server 8000
```

然后访问 `http://localhost:8000`。

## 部署到 Render

1. 在 Render 中选择 **New + → Static Site**。
2. 连接此 GitHub 仓库。
3. Build Command 留空。
4. Publish Directory 填写 `.`。
5. 点击 **Create Static Site**。

仓库包含 `render.yaml` 作为配置参考。

## 导入格式

CSV / TXT 每行可按以下顺序填写：

```text
word,gloss,phonetic,example,translation
enhance,增强；提高,/ɪnˈhɑːns/,The method can enhance learning.,这个方法可以提高学习效果。
```

JSON 可使用对象数组，例如：

```json
[
  {
    "word": "enhance",
    "gloss": "增强；提高",
    "phonetic": "/ɪnˈhɑːns/",
    "example": "The method can enhance learning.",
    "translation": "这个方法可以提高学习效果。"
  }
]
```

## 当前版本说明

这是无需后端的前端原型。学习数据保存在当前浏览器中，不会自动跨设备同步；尚未接入 AI 评分、账号系统或云端存储。更换设备或浏览器前，请先导出备份。

## License

MIT

import "dotenv/config";
import TelegramBot from "node-telegram-bot-api";
import { 
  handleStart, 
  handleBook, 
  handleApprove, 
  handleStatus, 
  handleHelp,
  handleTeam,
  handleAddMember,
  handleSetSchedule,
  handleMakeSupervisor
} from "./commands";

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error("❌ TELEGRAM_BOT_TOKEN is not set in environment variables");
  console.log("Create a .env file in the bot directory with:");
  console.log("TELEGRAM_BOT_TOKEN=your_bot_token_here");
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

console.log("🤖 LeaveBot Telegram bot started!");

// Command handlers
bot.onText(/\/start/, (msg) => handleStart(bot, msg));
bot.onText(/\/help/, (msg) => handleHelp(bot, msg));
bot.onText(/\/book/, (msg) => handleBook(bot, msg));
bot.onText(/\/approve/, (msg) => handleApprove(bot, msg));
bot.onText(/\/status/, (msg) => handleStatus(bot, msg));
bot.onText(/\/team/, (msg) => handleTeam(bot, msg));
bot.onText(/\/addmember/, (msg) => handleAddMember(bot, msg));
bot.onText(/\/setschedule/, (msg) => handleSetSchedule(bot, msg));
bot.onText(/\/makesupervisor/, (msg) => handleMakeSupervisor(bot, msg));

// Error handling
bot.on("polling_error", (error) => {
  console.error("Polling error:", error);
});

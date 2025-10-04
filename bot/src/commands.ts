import type TelegramBot from "node-telegram-bot-api";
import type { Message } from "node-telegram-bot-api";

const API_BASE = process.env.API_BASE_URL || "http://localhost:5001/api";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME; // Your Telegram username

async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" })) as { error?: string };
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

// Register or get employee by Telegram username
async function registerUser(msg: Message): Promise<{ 
  id: number; 
  name: string;
  role: string;
  shift: string;
  scheduleType: string;
}> {
  const username = msg.from?.username;
  const firstName = msg.from?.first_name || "User";
  const lastName = msg.from?.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim();
  const chatId = msg.chat.id;

  if (!username) {
    throw new Error("You need a Telegram username to use this bot. Please set one in Telegram settings.");
  }

  const { employee } = await apiCall<{ employee: any }>(
    "/telegram/register",
    {
      method: "POST",
      body: JSON.stringify({ username, name: fullName, chatId }),
    }
  );

  return employee;
}

function isAdmin(msg: Message): boolean {
  return msg.from?.username === ADMIN_USERNAME;
}

export async function handleStart(bot: TelegramBot, msg: Message) {
  const chatId = msg.chat.id;
  
  try {
    const employee = await registerUser(msg);
    const isSupervisorOrAdmin = employee.role === "admin" || employee.role === "supervisor";
    const roleEmoji = employee.role === "admin" ? "🔑" : employee.role === "supervisor" ? "👔" : "👤";
    
    const supervisorCommands = isSupervisorOrAdmin
      ? `\n/team - View your team members
/addmember - Add a member to your team
/setschedule - Configure member's schedule\n`
      : "";
    
    const welcomeMessage = `
👋 Welcome to LeaveBot, ${employee.name}!

${roleEmoji} *Role:* ${employee.role}
⏰ *Shift:* ${employee.shift}
📅 *Schedule:* ${employee.scheduleType}

*Available Commands:*
/help - Show this help message
/book - Book leave days for yourself
/calendar - View team calendar for current month
/status - Check all leave requests${employee.role === "admin" ? "\n/approve - Approve pending requests (admin)" : ""}${supervisorCommands}

Get started by typing /book to request leave!
  `;

    await bot.sendMessage(chatId, welcomeMessage, { parse_mode: "Markdown" });
  } catch (error) {
    await bot.sendMessage(
      chatId,
      `❌ Error: ${error instanceof Error ? error.message : "Failed to register"}`
    );
  }
}

export async function handleHelp(bot: TelegramBot, msg: Message) {
  await handleStart(bot, msg);
}

export async function handleBook(bot: TelegramBot, msg: Message) {
  const chatId = msg.chat.id;

  try {
    const employee = await registerUser(msg);
    const text = msg.text || "";
    const parts = text.split(" ").slice(1);

    if (parts.length < 2) {
      await bot.sendMessage(
        chatId,
        `📝 *Book Leave Request*\n\nPlease send your request in this format:\n\`/book <start_date> <end_date> [reason]\`\n\nExample: \`/book 2025-10-15 2025-10-17 Vacation\`\n\nFor emergency leave (bypasses 14-day rule):\n\`/book 2025-10-15 2025-10-17 Emergency sick leave --emergency\``,
        { parse_mode: "Markdown" }
      );
      return;
    }

    const startDate = parts[0];
    const endDate = parts[1];
    
    // Check if --emergency flag is present
    const hasEmergencyFlag = parts.includes("--emergency");
    const reasonParts = parts.slice(2).filter(p => p !== "--emergency");
    const reason = reasonParts.join(" ") || undefined;
    const isEmergency = hasEmergencyFlag && (employee.role === "admin" || employee.role === "supervisor");

    // Validate first
    const { valid, errors, warnings } = await apiCall<{
      valid: boolean;
      errors: string[];
      warnings: string[];
    }>("/leave-requests/validate", {
      method: "POST",
      body: JSON.stringify({ 
        employeeId: employee.id, 
        startDate, 
        endDate,
        isEmergency
      }),
    });

    if (!valid) {
      await bot.sendMessage(
        chatId,
        `❌ *Cannot book leave:*\n\n${errors.map(e => `• ${e}`).join("\n")}`,
        { parse_mode: "Markdown" }
      );
      return;
    }

    const { request, warnings: createWarnings } = await apiCall<{ 
      request: any;
      warnings?: string[];
    }>("/leave-requests", {
      method: "POST",
      body: JSON.stringify({ 
        employeeId: employee.id, 
        startDate, 
        endDate, 
        reason,
        isEmergency
      }),
    });

    const warningText = (warnings.length > 0 || (createWarnings && createWarnings.length > 0))
      ? `\n\n⚠️ Warnings:\n${[...warnings, ...(createWarnings || [])].map(w => `• ${w}`).join("\n")}`
      : "";

    await bot.sendMessage(
      chatId,
      `✅ Leave request created successfully!${isEmergency ? " (Emergency)" : ""}\n\n` +
        `📋 Request ID: ${request.id}\n` +
        `👤 Employee: ${request.employeeName}\n` +
        `📅 Dates: ${request.startDate} to ${request.endDate}\n` +
        `📝 Status: ${request.status}\n` +
        `${request.reason ? `💬 Reason: ${request.reason}` : ""}${warningText}`
    );
  } catch (error) {
    console.error("Error in handleBook:", error);
    await bot.sendMessage(
      chatId,
      `❌ Error: ${error instanceof Error ? error.message : "Failed to process request"}`
    );
  }
}

export async function handleStatus(bot: TelegramBot, msg: Message) {
  const chatId = msg.chat.id;

  try {
    const { requests } = await apiCall<{ requests: any[] }>("/leave-requests");

    if (requests.length === 0) {
      await bot.sendMessage(chatId, "📭 No leave requests found.");
      return;
    }

    const statusMessage = requests
      .map(
        (req) =>
          `📋 Request #${req.id}\n` +
          `👤 ${req.employeeName}\n` +
          `📅 ${req.startDate} to ${req.endDate}\n` +
          `📝 Status: ${req.status === "approved" ? "✅ Approved" : "⏳ Pending"}\n` +
          `${req.reason ? `💬 ${req.reason}` : ""}`
      )
      .join("\n\n");

    await bot.sendMessage(chatId, `*Leave Requests:*\n\n${statusMessage}`, {
      parse_mode: "Markdown",
    });
  } catch (error) {
    console.error("Error in handleStatus:", error);
    await bot.sendMessage(chatId, "❌ Failed to fetch leave requests.");
  }
}

export async function handleApprove(bot: TelegramBot, msg: Message) {
  const chatId = msg.chat.id;

  try {
    if (!isAdmin(msg)) {
      await bot.sendMessage(chatId, "❌ Only the admin can approve leave requests.");
      return;
    }

    const { requests } = await apiCall<{ requests: any[] }>("/leave-requests");
    const pending = requests.filter((r) => r.status === "pending");

    if (pending.length === 0) {
      await bot.sendMessage(chatId, "✅ No pending requests to approve.");
      return;
    }

    const pendingList = pending
      .map(
        (req) =>
          `${req.id}. ${req.employeeName} - ${req.startDate} to ${req.endDate}` +
          `${req.reason ? ` (${req.reason})` : ""}`
      )
      .join("\n");

    await bot.sendMessage(
      chatId,
      `👔 *Pending Approvals:*\n\n${pendingList}\n\nTo approve, send: \`/approve <request_id>\`\n\nExample: \`/approve 1\``,
      { parse_mode: "Markdown" }
    );

    // Parse approval if command has parameters
    const text = msg.text || "";
    const parts = text.split(" ").slice(1);

    if (parts.length > 0) {
      const requestId = parseInt(parts[0], 10);

      if (isNaN(requestId)) {
        await bot.sendMessage(chatId, "❌ Invalid request ID. Must be a number.");
        return;
      }

      const { request } = await apiCall<{ request: any }>(
        `/leave-requests/${requestId}/approve`,
        { method: "POST" }
      );

      await bot.sendMessage(
        chatId,
        `✅ Approved!\n\n` +
          `📋 Request #${request.id}\n` +
          `👤 ${request.employeeName}\n` +
          `📅 ${request.startDate} to ${request.endDate}`
      );
    }
  } catch (error) {
    console.error("Error in handleApprove:", error);
    await bot.sendMessage(
      chatId,
      `❌ Error: ${error instanceof Error ? error.message : "Failed to approve request"}`
    );
  }
}

export async function handleTeam(bot: TelegramBot, msg: Message) {
  const chatId = msg.chat.id;

  try {
    const currentUser = await registerUser(msg);
    
    if (currentUser.role !== "admin" && currentUser.role !== "supervisor") {
      await bot.sendMessage(chatId, "❌ Only supervisors and admins can view team members.");
      return;
    }

    const { employees } = await apiCall<{ employees: any[] }>("/employees");
    
    // Filter team members if supervisor (only show their team)
    let teamMembers = employees;
    if (currentUser.role === "supervisor") {
      teamMembers = employees.filter(e => e.supervisor_id === currentUser.id);
    }

    if (teamMembers.length === 0) {
      await bot.sendMessage(
        chatId,
        "📋 No team members found.\n\nUse `/addmember` to add team members.",
        { parse_mode: "Markdown" }
      );
      return;
    }

    const membersList = teamMembers
      .map(
        (emp) =>
          `👤 *${emp.name}* (ID: ${emp.id})\n` +
          `   Role: ${emp.role || "team_member"}\n` +
          `   Shift: ${emp.shift || "day"}\n` +
          `   Schedule: ${emp.scheduleType || "mon_fri"}`
      )
      .join("\n\n");

    await bot.sendMessage(
      chatId,
      `👥 *Your Team Members:*\n\n${membersList}\n\n` +
        `*Commands:*\n` +
        `/addmember @username - Add a new team member\n` +
        `/setschedule <id> <shift> <schedule> - Set member's schedule`,
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    console.error("Error in handleTeam:", error);
    await bot.sendMessage(
      chatId,
      `❌ Error: ${error instanceof Error ? error.message : "Failed to fetch team"}`
    );
  }
}

export async function handleAddMember(bot: TelegramBot, msg: Message) {
  const chatId = msg.chat.id;

  try {
    const currentUser = await registerUser(msg);
    
    if (currentUser.role !== "admin" && currentUser.role !== "supervisor") {
      await bot.sendMessage(chatId, "❌ Only supervisors and admins can add team members.");
      return;
    }

    const text = msg.text || "";
    const parts = text.split(" ").slice(1);

    if (parts.length === 0) {
      await bot.sendMessage(
        chatId,
        `👥 *Add Team Member*\n\n` +
          `To add a member, they must:\n` +
          `1. Have a Telegram account with a username\n` +
          `2. Start a conversation with this bot (send /start)\n\n` +
          `Then use:\n\`/addmember @username\`\n\n` +
          `Example: \`/addmember @johndoe\``,
        { parse_mode: "Markdown" }
      );
      return;
    }

    let username = parts[0];
    // Remove @ if present
    if (username.startsWith("@")) {
      username = username.substring(1);
    }

    // Get or create the employee by telegram username
    const { employee } = await apiCall<{ employee: any }>(
      `/telegram/employee/${username}`,
      { method: "GET" }
    );

    if (!employee) {
      await bot.sendMessage(
        chatId,
        `❌ User @${username} not found.\n\nThey need to:\n1. Start this bot first (send /start)\n2. Then you can add them to your team.`
      );
      return;
    }

    // Update employee to set supervisor
    await apiCall<{ employee: any }>(`/employees/${employee.id}/supervisor`, {
      method: "PUT",
      body: JSON.stringify({ supervisorId: currentUser.id }),
    });

    await bot.sendMessage(
      chatId,
      `✅ Added *${employee.name}* (@${username}) to your team!\n\n` +
        `Use \`/setschedule ${employee.id} <shift> <schedule>\` to configure their work schedule.\n\n` +
        `Example: \`/setschedule ${employee.id} day 2_2\``,
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    console.error("Error in handleAddMember:", error);
    await bot.sendMessage(
      chatId,
      `❌ Error: ${error instanceof Error ? error.message : "Failed to add member"}`
    );
  }
}

export async function handleSetSchedule(bot: TelegramBot, msg: Message) {
  const chatId = msg.chat.id;

  try {
    const currentUser = await registerUser(msg);
    
    if (currentUser.role !== "admin" && currentUser.role !== "supervisor") {
      await bot.sendMessage(chatId, "❌ Only supervisors and admins can set schedules.");
      return;
    }

    const text = msg.text || "";
    const parts = text.split(" ").slice(1);

    if (parts.length < 3) {
      await bot.sendMessage(
        chatId,
        `⚙️ *Set Team Member Schedule*\n\n` +
          `Format: \`/setschedule <employee_id> <shift> <schedule_type>\`\n\n` +
          `*Shifts:*\n` +
          `• day - Day shift\n` +
          `• night - Night shift\n` +
          `• evening - Evening shift\n` +
          `• rotating - Rotating shift\n\n` +
          `*Schedule Types:*\n` +
          `• mon_fri - Monday to Friday\n` +
          `• 2_2 - 2 days on, 2 days off\n` +
          `• 3_3 - 3 days on, 3 days off\n` +
          `• 4_4 - 4 days on, 4 days off\n\n` +
          `Example: \`/setschedule 3 night 2_2\``,
        { parse_mode: "Markdown" }
      );
      return;
    }

    const employeeId = parseInt(parts[0], 10);
    const shift = parts[1];
    const scheduleType = parts[2];

    if (isNaN(employeeId)) {
      await bot.sendMessage(chatId, "❌ Invalid employee ID. Must be a number.");
      return;
    }

    // Validate shift and schedule type
    const validShifts = ["day", "night", "evening", "rotating"];
    const validSchedules = ["mon_fri", "2_2", "3_3", "4_4", "custom"];

    if (!validShifts.includes(shift)) {
      await bot.sendMessage(
        chatId,
        `❌ Invalid shift. Must be one of: ${validShifts.join(", ")}`
      );
      return;
    }

    if (!validSchedules.includes(scheduleType)) {
      await bot.sendMessage(
        chatId,
        `❌ Invalid schedule type. Must be one of: ${validSchedules.join(", ")}`
      );
      return;
    }

    // Get today's date for schedule start
    const today = new Date().toISOString().split("T")[0];

    await apiCall<{ employee: any }>(`/employees/${employeeId}/schedule`, {
      method: "PUT",
      body: JSON.stringify({
        shift,
        scheduleType,
        scheduleStartDate: today,
      }),
    });

    await bot.sendMessage(
      chatId,
      `✅ Schedule updated!\n\n` +
        `Employee ID: ${employeeId}\n` +
        `Shift: ${shift}\n` +
        `Schedule: ${scheduleType}\n` +
        `Start Date: ${today}`
    );
  } catch (error) {
    console.error("Error in handleSetSchedule:", error);
    await bot.sendMessage(
      chatId,
      `❌ Error: ${error instanceof Error ? error.message : "Failed to set schedule"}`
    );
  }
}

export async function handleMakeSupervisor(bot: TelegramBot, msg: Message) {
  const chatId = msg.chat.id;

  try {
    if (!isAdmin(msg)) {
      await bot.sendMessage(chatId, "❌ Only the admin can promote users to supervisor.");
      return;
    }

    const text = msg.text || "";
    const parts = text.split(" ").slice(1);

    if (parts.length === 0) {
      await bot.sendMessage(
        chatId,
        `👔 *Promote to Supervisor*\n\n` +
          `Format: \`/makesupervisor @username\`\n\n` +
          `Example: \`/makesupervisor @johndoe\`\n\n` +
          `This will allow them to:\n` +
          `• Add team members\n` +
          `• Set schedules\n` +
          `• Book emergency leaves`,
        { parse_mode: "Markdown" }
      );
      return;
    }

    let username = parts[0];
    if (username.startsWith("@")) {
      username = username.substring(1);
    }

    const { employee } = await apiCall<{ employee: any }>(
      `/telegram/employee/${username}`,
      { method: "GET" }
    );

    if (!employee) {
      await bot.sendMessage(
        chatId,
        `❌ User @${username} not found.\n\nThey need to start this bot first (send /start).`
      );
      return;
    }

    await apiCall<{ employee: any }>(`/employees/${employee.id}/role`, {
      method: "PUT",
      body: JSON.stringify({ role: "supervisor" }),
    });

    await bot.sendMessage(
      chatId,
      `✅ *${employee.name}* (@${username}) is now a supervisor!\n\n` +
        `They can now:\n` +
        `• Add team members with /addmember\n` +
        `• Set schedules with /setschedule\n` +
        `• View their team with /team`,
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    console.error("Error in handleMakeSupervisor:", error);
    await bot.sendMessage(
      chatId,
      `❌ Error: ${error instanceof Error ? error.message : "Failed to promote user"}`
    );
  }
}

export async function handleCalendar(bot: TelegramBot, msg: Message) {
  const chatId = msg.chat.id;

  try {
    // Get current month date range
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    const startDateStr = startDate.toISOString().slice(0, 10);
    const endDateStr = endDate.toISOString().slice(0, 10);

    // Fetch calendar data
    const { calendar } = await apiCall<{ calendar: any[] }>(
      `/calendar?startDate=${startDateStr}&endDate=${endDateStr}`
    );

    // Format calendar as text
    const monthName = startDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    let calendarText = `📅 *${monthName} Calendar*\n\n`;

    // Group days by week
    let weekDays: string[] = [];
    let currentWeek = 0;

    calendar.forEach((day: any) => {
      const date = new Date(day.date);
      const dayOfWeek = date.getDay();
      const weekOfMonth = Math.floor((date.getDate() - 1) / 7);

      // Start a new week
      if (weekOfMonth !== currentWeek) {
        if (weekDays.length > 0) {
          calendarText += weekDays.join(' ') + '\n';
          weekDays = [];
        }
        currentWeek = weekOfMonth;
      }

      const dayNum = date.getDate().toString().padStart(2, '0');
      const isWeekend = !day.isWorkday;
      
      let dayStatus = '';
      if (day.status === 'approved') {
        dayStatus = '🔴'; // Red for approved leave
      } else if (day.status === 'pending') {
        dayStatus = '🟡'; // Yellow for pending
      } else if (isWeekend) {
        dayStatus = '⬜'; // Grey for weekend
      } else {
        dayStatus = '✅'; // Green for available
      }

      weekDays.push(`${dayStatus}${dayNum}`);
    });

    // Add last week
    if (weekDays.length > 0) {
      calendarText += weekDays.join(' ') + '\n';
    }

    calendarText += `\n*Legend:*\n`;
    calendarText += `✅ Available\n`;
    calendarText += `🔴 On Leave (Approved)\n`;
    calendarText += `🟡 Pending Approval\n`;
    calendarText += `⬜ Weekend\n\n`;
    calendarText += `🌐 View full calendar: ${API_BASE.replace('/api', '')}`;

    await bot.sendMessage(chatId, calendarText, { parse_mode: "Markdown" });
  } catch (error) {
    console.error("Error in handleCalendar:", error);
    await bot.sendMessage(
      chatId,
      `❌ Error: ${error instanceof Error ? error.message : "Failed to fetch calendar"}`
    );
  }
}

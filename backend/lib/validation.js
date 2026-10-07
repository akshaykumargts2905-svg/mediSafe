function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function positiveInt(value, name = "id") {
  if (typeof value !== "number" && typeof value !== "string") {
    throw badRequest(name + " must be a positive integer");
  }
  if (typeof value === "string" && !/^[1-9]\d*$/.test(value)) {
    throw badRequest(name + " must be a positive integer");
  }
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0 || number > 2147483647) {
    throw badRequest(name + " must be a positive PostgreSQL integer");
  }
  return number;
}

// Only copy allowed fields. A ? permits null for nullable Prisma fields.
function readFields(body, rules, required = []) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw badRequest("A JSON object body is required");
  }
  const data = {};
  for (const field of required) {
    if (body[field] === undefined || body[field] === null) {
      throw badRequest(field + " is required");
    }
  }
  for (const [field, rule] of Object.entries(rules)) {
    const value = body[field];
    if (value === undefined) continue;
    if (value === null && rule.endsWith("?")) {
      data[field] = null;
      continue;
    }
    const type = rule.replace("?", "");
    if (type === "id") {
      data[field] = positiveInt(value, field);
    } else if (type === "boolean") {
      if (typeof value !== "boolean") throw badRequest(field + " must be a boolean");
      data[field] = value;
    } else if (type === "float") {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        throw badRequest(field + " must be a finite number");
      }
      data[field] = value;
    } else {
      if (typeof value !== "string" || !value.trim()) {
        throw badRequest(field + " must be a non-empty string");
      }
      data[field] = type === "password" ? value : value.trim();
      if (type === "email") {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data[field])) {
          throw badRequest("email must be a valid email address");
        }
        data[field] = data[field].toLowerCase();
      }
    }
  }
  return data;
}

function requireChanges(data) {
  if (Object.keys(data).length === 0) {
    throw badRequest("Provide at least one editable field");
  }
}

function idList(value, name) {
  if (!Array.isArray(value)) throw badRequest(name + " must be an array of IDs");
  return [...new Set(value.map((id) => positiveInt(id, name)))];
}

module.exports = { badRequest, positiveInt, readFields, requireChanges, idList };

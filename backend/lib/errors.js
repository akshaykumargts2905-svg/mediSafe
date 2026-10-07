function sendError(res, error) {
  if (error.status === 400 || error.status === 404) {
    return res.status(error.status).json({ message: error.message });
  }
  if (error.code === "P2002") {
    return res.status(409).json({ message: "A record with these unique values already exists" });
  }
  if (error.code === "P2025") {
    return res.status(404).json({ message: "Record not found" });
  }
  // Prisma 6 can surface PostgreSQL RESTRICT (23001) as an unknown request error.
  const restrictedDelete = error.name === "PrismaClientUnknownRequestError" &&
    /code: "23001"/.test(error.message || "");
  if (error.code === "P2003" || restrictedDelete) {
    return res.status(409).json({
      message: "Related record does not exist, or this record is still referenced",
    });
  }
  if (error.code === "P2034") {
    return res.status(409).json({ message: "Concurrent update detected. Please retry the request" });
  }
  // Do not send raw database errors or connection credentials to the client.
  console.error("API error:", error.code || error.name || "Unknown error");
  return res.status(500).json({ message: "A server or database error occurred" });
}

module.exports = sendError;

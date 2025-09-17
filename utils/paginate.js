export const paginateQuery = async (model, query = {}, populate = [], page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  // Build query
  let dbQuery = model.find(query);

  // Apply populate if provided
  if (populate.length > 0) {
    populate.forEach((p) => {
      dbQuery = dbQuery.populate(p);
    });
  }

  // Apply pagination
  const results = await dbQuery.skip(skip).limit(limit);

  // Count total documents
  const total = await model.countDocuments(query);

  return {
    results,
    pagination: {
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      limit,
    },
  };
};

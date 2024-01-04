const express = require("express");
const cors = require("cors");
const authRoutes = require("./authRoutes.js");
const app = express();
const port = 4000;
const pool = require("./db.js");
app.use(express.json());
app.use(cors({
  origin:['https://seahorse-app-k3ujm.ondigitalocean.app', 'http://localhost:3000']
}));
app.use("/api", authRoutes);

//create new job
app.post("/api/jobs", async (req, res) => {
  try {
    let {
      cvg_job_number,
      facility,
      client_code,
      client_company,
      client_contact_person,
      client_phone_number,
      property_code,
      description,
      location,
      scope_code,
      scope,
      date_opened,
      due_date,
      original_fee_quote,
      original_retainer,
      original_retainer_received,
      updated_quote,
      updated_retainer,
      updated_check_number_date,
      status_comments,
      invoice_num_and_date_sent,
      received_payment,
      payment_check_number_date,
      revised_invoice_and_date_sent,
      revised_payment,
      revised_check_number_date,
      due_to_cvg,
      paid_in_full,
      staff1,
      staff1_payment,
      staff1_check_number_date,
      staff2,
      staff2_payment,
      staff2_check_number_date,
      staff3,
      staff3_payment,
      staff3_check_number_date,
      net_mlc,
      comments,
    } = req.body;

    const insertQuery = `
  INSERT INTO client_data (
      cvg_job_number, 
      facility, 
      client_code,
      client_company, 
      client_contact_person, 
      client_phone_number,
      property_code,
      description, location,
      scope_code,
      scope, date_opened,
      due_date,
      original_fee_quote,
      original_retainer,
      original_retainer_received,
      updated_quote,
      updated_retainer,
      updated_check_number_date,
      status_comments,
      invoice_num_and_date_sent,
      received_payment,
      payment_check_number_date,
      revised_invoice_and_date_sent,
      revised_payment,
      revised_check_number_date,
      due_to_cvg,
      paid_in_full,
      staff1,
      staff1_payment,
      staff1_check_number_date,
      staff2,
      staff2_payment,
      staff2_check_number_date,
      staff3,
      staff3_payment,
      staff3_check_number_date,
      net_mlc,
      comments
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39)`;

    await pool.query(insertQuery, [
      cvg_job_number,
      facility,
      client_code,
      client_company,
      client_contact_person,
      client_phone_number,
      property_code,
      description,
      location,
      scope_code,
      scope,
      date_opened,
      due_date,
      original_fee_quote,
      original_retainer,
      original_retainer_received,
      updated_quote,
      updated_retainer,
      updated_check_number_date,
      status_comments,
      invoice_num_and_date_sent,
      received_payment,
      payment_check_number_date,
      revised_invoice_and_date_sent,
      revised_payment,
      revised_check_number_date,
      due_to_cvg,
      paid_in_full,
      staff1,
      staff1_payment,
      staff1_check_number_date,
      staff2,
      staff2_payment,
      staff2_check_number_date,
      staff3,
      staff3_payment,
      staff3_check_number_date,
      net_mlc,
      comments,
    ]);

    res.status(201).send("Job added successfully");
  } catch (error) {
    console.error("Error adding new job", error);
    res.status(500).send("Internal Server Error");
  }
});

//get jobs and paginate them
app.get("/api/jobs", async (req, res) => {
  try {
    // Retrieve pagination and filter parameters from the query string
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 30;
    const {
      clientName,
      propertyType,
      reportType,
      zipCode,
      openedStartDate,
      openedEndDate,
      dueStartDate,
      dueEndDate,
      staffMember,
    } = req.query;

    // Construct the WHERE clause based on filters
    const filterValues = [];
    const filterClauses = [];
    if (clientName) {
      filterClauses.push(
        `client_company ILIKE $${filterValues.length + 1}::text`
      );
      filterValues.push(`%${clientName}%`);
    }
    if (propertyType) {
      filterClauses.push(
        `property_code ILIKE $${filterValues.length + 1}::text`
      );
      filterValues.push(`%${propertyType}%`);
    }
    if (reportType) {
      filterClauses.push(`scope_code ILIKE $${filterValues.length + 1}::text`);
      filterValues.push(`%${reportType}%`);
    }
    if (zipCode) {
      filterClauses.push(`location ILIKE $${filterValues.length + 1}::text`);
      filterValues.push(`%${zipCode}%`);
    }

    // Inside your '/api/jobs' route
    if (openedStartDate && openedEndDate) {
      filterClauses.push(
        `date_opened BETWEEN $${filterValues.length + 1} AND $${
          filterValues.length + 2
        }`
      );
      filterValues.push(openedStartDate, openedEndDate);
    } else if (openedStartDate) {
      filterClauses.push(`date_opened >= $${filterValues.length + 1}`);
      filterValues.push(openedStartDate);
    } else if (openedEndDate) {
      filterClauses.push(`date_opened <= $${filterValues.length + 1}`);
      filterValues.push(openedEndDate);
    }

    if (staffMember) {
      const staffFilter = `(
        staff1 ILIKE '%${staffMember}%' OR 
        staff2 ILIKE '%${staffMember}%' OR 
        staff3 ILIKE '%${staffMember}%'
    )`;
      filterClauses.push(staffFilter);
    }

    const whereClause =
      filterClauses.length > 0 ? `WHERE ${filterClauses.join(" AND ")}` : "";

    // Calculate the offset for pagination
    const offset = (page - 1) * pageSize;

    // Query to get paginated and filtered results
    const query = `SELECT * FROM client_data ${whereClause} ORDER BY date_opened IS NULL, date_opened ASC, cvg_job_number LIMIT $${
      filterValues.length + 1
    } OFFSET $${filterValues.length + 2}`;

    // Execute the query with combined filterValues, pageSize, and offset
    const result = await pool.query(query, [...filterValues, pageSize, offset]);

    // Query to get the total count of records with filters
    const countQuery = `SELECT COUNT(*) FROM client_data ${whereClause}`;

    // Execute the count query with filterValues
    const countResult = await pool.query(countQuery, filterValues);
    const totalItems = parseInt(countResult.rows[0].count);

    // Calculate total pages
    const totalPages = Math.ceil(totalItems / pageSize);
    res.json({
      data: result.rows,
      currentPage: page,
      totalPages: totalPages,
      totalItems: totalItems,
    });
  } catch (error) {
    console.error("Error executing query", error.message);
    console.error("Detailed stack:", error.stack);
    console.error("Error executing query", error);
    res.status(500).send("Internal Server Error");
  }
});

app.put("/api/jobs/:currentCvgJobNumber", async (req, res) => {
  try {
    const { currentCvgJobNumber } = req.params;
    const updateFields = req.body;

    // Start building the query
    let updateQuery = "UPDATE client_data SET ";
    const queryParams = [];

    // Add each field to the query
    Object.keys(updateFields).forEach((key, index) => {
      updateQuery += `${key} = $${index + 1}, `;
      queryParams.push(updateFields[key]);
    });

    // Remove the last comma and space
    updateQuery = updateQuery.slice(0, -2);

    // Add the WHERE clause
    updateQuery += ` WHERE cvg_job_number = $${queryParams.length + 1}`;
    queryParams.push(currentCvgJobNumber);

    await pool.query(updateQuery, queryParams);

    res.status(200).send("Job updated successfully");
  } catch (error) {
    console.error("Error updating job", error);
    res.status(500).send("Internal Server Error");
  }
});

//delete job
app.delete("/api/jobs/:cvgJobNumber", async (req, res) => {
  try {
    const cvgJobNumber = req.params.cvgJobNumber;
    console.log(cvgJobNumber);

    const deleteQuery = `DELETE FROM client_data WHERE cvg_job_number = $1`;
    const result = await pool.query(deleteQuery, [cvgJobNumber]);
    if (result.rowCount === 0) {
      return res.status(404).send("Job not found");
    }

    res.status(200).send("Job deleted successfully");
  } catch (error) {
    console.error("Error deleting job", error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

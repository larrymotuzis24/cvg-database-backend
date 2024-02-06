const express = require("express");
const cors = require("cors");
const authRoutes = require("./authRoutes.js");
const XLSX = require('xlsx');
const app = express();
const port = process.env.PORT || 5001;
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
      client_contact,
      client_address,
      property_code,
      description,
      location,
      scope_code,
      scope,
      date_opened,
      due_date,
      original_fee_quote,
      original_retainer,
      original_retainer_check_and_date,
      updated_quote,
      updated_retainer,
      updated_check_number_date,
      status_comments,
      invoice_num_and_date_sent,
      received_payment,
      received_check_and_date,
      updated_invoice_and_date_sent,
      updated_received_payment,
      check_number_and_date,
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

    original_fee_quote = original_fee_quote ? Number(original_fee_quote) : null;
    original_retainer = original_retainer ? Number(original_retainer) : null;
    updated_retainer = updated_retainer ? Number(updated_retainer) : null;
    received_payment = received_payment ? Number(received_payment) : null;
    updated_received_payment = updated_received_payment ? Number(updated_received_payment) : null;
    updated_quote = updated_quote ? Number(updated_quote) : null;

    console.log('Processed job data before DB insertion:', {
      original_fee_quote, 
      original_retainer,
      updated_retainer,
      received_payment,
      updated_received_payment,
      updated_quote,
      // ... other fields ...
  });
  

    const insertQuery = `
    INSERT INTO client_data (
      cvg_job_number,
      facility,
      client_code,
      client_company,
      client_contact,
      client_address,
      property_code,
      description,
      location,
      scope_code,
      scope,
      date_opened,
      due_date,
      original_fee_quote,
      original_retainer,
      original_retainer_check_and_date,
      updated_quote,
      updated_retainer,
      updated_check_number_date,
      status_comments,
      invoice_num_and_date_sent,
      received_payment,
      received_check_and_date,
      updated_invoice_and_date_sent,
      updated_received_payment,
      check_number_and_date,
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
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38);`;
  

    await pool.query(insertQuery, [
      cvg_job_number,
      facility,
      client_code,
      client_company,
      client_contact,
      client_address,
      property_code,
      description,
      location,
      scope_code,
      scope,
      date_opened,
      due_date,
      original_fee_quote,
      original_retainer,
      original_retainer_check_and_date,
      updated_quote,
      updated_retainer,
      updated_check_number_date,
      status_comments,
      invoice_num_and_date_sent,
      received_payment,
      received_check_and_date,
      updated_invoice_and_date_sent,
      updated_received_payment,
      check_number_and_date,
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
    ]);

    res.status(201).send("Job added successfully");
  } catch (error) {
    console.error("Error adding new job", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/api/jobs", async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 30;

    // Filter parameters
    const {
      cvg_job_number, 
      scope_code, 
      client_company,
      propertyType,
      location,
      staffMember,
      openedStartDate,
      openedEndDate
    } = req.query;

    // Initialize filter values and clauses arrays
    const filterValues = [];
    const filterClauses = [];

    // Dynamic filter construction based on provided query parameters
    if (client_company) {
      filterClauses.push(`client_company ILIKE $${filterValues.length + 1}`);
      filterValues.push(`%${client_company}%`);
    }
    if (propertyType) {
      filterClauses.push(`property_code ILIKE $${filterValues.length + 1}`);
      filterValues.push(`%${propertyType}%`);
    }
  
    if (location) {
      filterClauses.push(`location ILIKE $${filterValues.length + 1}`);
      filterValues.push(`%${location}%`);
    }
    if (cvg_job_number) {
      filterClauses.push(`cvg_job_number = $${filterValues.length + 1}`);
      filterValues.push(cvg_job_number);
    }
    if (scope_code) {
      filterClauses.push(`scope_code = $${filterValues.length + 1}`);
      filterValues.push(scope_code);
    }
    

    if (openedStartDate && openedEndDate) {
      filterClauses.push(`date_opened BETWEEN $${filterValues.length + 1} AND $${filterValues.length + 2}`);
      filterValues.push(openedStartDate, openedEndDate);
    } else if (openedStartDate) {
      filterClauses.push(`date_opened >= $${filterValues.length + 1}`);
      filterValues.push(openedStartDate);
    } else if (openedEndDate) {
      filterClauses.push(`date_opened <= $${filterValues.length + 1}`);
      filterValues.push(openedEndDate);
    }



if (staffMember) {
  const staffMemberFilter = `
    (staff1 ILIKE $${filterValues.length + 1} OR 
    staff2 ILIKE $${filterValues.length + 1} OR 
    staff3 ILIKE $${filterValues.length + 1})
  `;
  filterClauses.push(staffMemberFilter);
  filterValues.push(`%${staffMember}%`); 
}




    const whereClause = filterClauses.length > 0 ? `WHERE ${filterClauses.join(" AND ")}` : "";


    const query = `SELECT * FROM client_data ${whereClause} ORDER BY date_opened DESC, cvg_job_number LIMIT $${filterValues.length + 1} OFFSET $${filterValues.length + 2}`;
    const result = await pool.query(query, [...filterValues, pageSize, (page - 1) * pageSize]);

    const countQuery = `SELECT COUNT(*) FROM client_data ${whereClause}`;
    const countResult = await pool.query(countQuery, filterValues);
    const totalItems = parseInt(countResult.rows[0].count);


    const totalPages = Math.ceil(totalItems / pageSize);

    res.json({
      data: result.rows,
      currentPage: page,
      totalPages: totalPages,
      totalItems: totalItems,
    });
  } catch (error) {
    console.error("Error fetching jobs:", error.message);
    res.status(500).send("Internal Server Error");
  }
});


app.put("/api/jobs/:currentCvgJobNumber", async (req, res) => {
  try {
    const { currentCvgJobNumber } = req.params;
    const updateFields = req.body;


    let updateQuery = "UPDATE client_data SET ";
    const queryParams = [];


    Object.keys(updateFields).forEach((key, index) => {
      updateQuery += `${key} = $${index + 1}, `;
      queryParams.push(updateFields[key]);
    });
    updateQuery = updateQuery.slice(0, -2);


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

app.get("/api/export-to-excel", async (req, res) => {
  try {
 
      const result = await pool.query('SELECT * FROM client_data'); 
      const jsonData = result.rows;

      // Convert data to Excel format
      const worksheet = XLSX.utils.json_to_sheet(jsonData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=export.xlsx');

      // Send the workbook
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      res.send(excelBuffer);
  } catch (error) {
      console.error("Error exporting to Excel", error);
      res.status(500).send("Internal Server Error");
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

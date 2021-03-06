/**
* Sort order is ordered by most important (lowest number, top of list)
* to least important (largest number, bottom of list)
*/
const JobStatus = {
  "N/A": {
    displayName: "N/A",
    sortOrder: 1
  },
  Success: {
    displayName: "Success",
    sortOrder: 2
  },
  Failed: {
    displayName: "Failed",
    sortOrder: 0
  }
};

module.exports = JobStatus;

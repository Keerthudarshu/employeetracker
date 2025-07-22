export function downloadCSV(data: string, filename: string) {
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToCSV(reports: any[], filename?: string) {
  const csvHeader = 'Date,Employee ID,Employee Name,Dials,Connected Calls,Positive Prospect,Dead Calls,Demos,Admission,Client Visit,Client Closing,Backdoor Calls,Posters Done\n';
  const csvData = reports.map(report => 
    `${report.submissionDate},${report.employeeId},${report.employeeName},${report.numberOfDials},${report.connectedCalls},${report.positiveProspect},${report.deadCalls},${report.demos},${report.admission},${report.clientVisit},${report.clientClosing},${report.backdoorCalls},${report.postersDone || 0}`
  ).join('\n');
  
  const finalFilename = filename || `daily-reports-${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(csvHeader + csvData, finalFilename);
}

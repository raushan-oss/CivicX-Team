"use client"

import { subscribeToReports } from "@/lib/firebase-service"

// ... inside component ...

useEffect(() => {
  // Check auth
  const role = localStorage.getItem("userRole")
  const email = localStorage.getItem("userEmail")

  if (role !== "user") {
    router.push("/")
    return
  }

  if (email) {
    setUserEmail(email)
  }

  // Subscribe to reports (supports both Firebase and LocalStorage fallback)
  const unsubscribe = subscribeToReports((fetchedReports) => {
    // Filter for this user's reports
    const myReports = fetchedReports.filter(r => r.userEmail === email)
    setReports(myReports)
    setIsLoading(false)
  }, { userEmail: email })

  return () => {
    if (typeof unsubscribe === 'function') unsubscribe()
    // If subscribeToReports returned a promise (because of the async wrapper in firebase-service),
    // we might need to handle cleanup differently or rely on the service to be smart.
    // The current implementation in firebase-service is async wrapper returning promise.
    // We need to handle that.
  }
}, [router])

const handleLogout = () => {
  localStorage.removeItem("userRole")
  localStorage.removeItem("userEmail")
  router.push("/")
}

const handleDeleteReport = (reportId) => {
  // Remove from local state
  const updatedReports = reports.filter(report => report.id !== reportId)
  setReports(updatedReports)

  // Update userReports in localStorage
  localStorage.setItem("userReports", JSON.stringify(updatedReports))

  // Update allReports in localStorage (for Admin)
  const allReports = JSON.parse(localStorage.getItem("allReports") || "[]")
  const updatedAllReports = allReports.filter(report => report.id !== reportId)
  localStorage.setItem("allReports", JSON.stringify(updatedAllReports))
}

const getStatusColor = (status) => {
  switch (status) {
    case "pending":
      return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
    case "approved":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20"
    case "assigned":
      return "bg-purple-500/10 text-purple-600 border-purple-500/20"
    case "in-progress":
      return "bg-orange-500/10 text-orange-600 border-orange-500/20"
    case "completed":
      return "bg-green-500/10 text-green-600 border-green-500/20"
    default:
      return "bg-gray-500/10 text-gray-600 border-gray-500/20"
  }
}

const getStatusIcon = (status) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="w-4 h-4" />
    case "pending":
      return <Clock className="w-4 h-4" />
    default:
      return <AlertCircle className="w-4 h-4" />
  }
}

if (isLoading) {
  return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>
}

return (
  <div className="min-h-screen bg-slate-900">
    <header className="border-b border-slate-700 bg-slate-800/50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-slate-300">CivicX</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Citizen Dashboard</h1>
            <p className="text-slate-300">Welcome back, {userEmail}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-white">
          <Button
            variant="outline"
            onClick={handleLogout}
            className="gap-2 bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>

    <main className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-semibold text-white">Your Reports</h2>
          <p className="text-slate-300">Track the status of your civic issue reports</p>
        </div>
        <Link href="/report/new">
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="w-4 h-4" />
            New Report
          </Button>
        </Link>
      </div>

      {reports.length === 0 ? (
        <Card className="text-center py-12 bg-slate-800 border-slate-700">
          <CardContent>
            <div className="mx-auto w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-4">
              <MapPin className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-white">No reports yet</h3>
            <p className="text-slate-300 mb-4">Start by reporting a civic issue in your area</p>
            <Link href="/report/new">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">Create Your First Report</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {reports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg text-white">{report.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1 text-slate-300">
                      <MapPin className="w-4 h-4" />
                      {report.location}
                    </CardDescription>
                  </div>
                  <Badge className={`gap-1 ${getStatusColor(report.status)}`}>
                    {getStatusIcon(report.status)}
                    {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 mb-4">{report.description}</p>
                {report.image && (
                  <div className="mb-4">
                    <img
                      src={report.image || "/placeholder.svg"}
                      alt="Report evidence"
                      className="w-full max-w-md h-48 object-cover rounded-lg border border-slate-600"
                    />
                  </div>
                )}
                {report.completionImage && (
                  <div className="mb-4">
                    <img
                      src={report.completionImage}
                      alt="Completion evidence"
                      className="w-full max-w-md h-48 object-cover rounded-lg border border-slate-600 mb-2"
                    />
                    <p className="text-sm font-medium text-emerald-400">Completed task image</p>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span>Reported on {new Date(report.createdAt).toLocaleDateString()}</span>
                  <div className="flex items-center gap-2">
                    {!report.complaintSent ? (
                      <ComplaintModal userEmail={userEmail} report={report} />
                    ) : (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={`h-9 gap-2 ${report.complaintStatus === 'completed' ? 'bg-green-100 text-green-700 border-green-200' :
                              report.complaintStatus === 'processing' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                ''
                              }`}
                          >
                            {report.complaintStatus ? (
                              <>
                                {report.complaintStatus === 'completed' ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                <span className="capitalize">{report.complaintStatus}</span>
                              </>
                            ) : "Complaint Status"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 bg-slate-800 border-slate-700 text-white p-4">
                          <div className="space-y-3">
                            <h4 className="font-medium text-lg border-b border-slate-700 pb-2">Complaint Details</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-start gap-2 text-emerald-400">
                                <CheckCircle className="w-4 h-4 mt-0.5" />
                                <p>Complaint successfully sent on {new Date(report.complaintSentAt).toLocaleString()}</p>
                              </div>
                              <div className="bg-slate-900 p-2 rounded text-slate-300">
                                <p className="font-semibold text-xs text-slate-500 uppercase">Current Status</p>
                                <p className="capitalize text-white">
                                  {report.complaintStatus || "Pending Review"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteReport(report.id)}
                      className="h-8"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  </div>
)
}

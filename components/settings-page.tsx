"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Settings, Trash2, ArrowLeft } from "lucide-react"
import { clearAllData } from "@/lib/storage"

interface SettingsPageProps {
  onBack: () => void
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  const handleResetData = () => {
    clearAllData()
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              <CardTitle>Settings</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
          <CardDescription>Manage your application settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* データ管理 */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">Data Management</h3>
              <p className="text-sm text-muted-foreground">Manage your practice data and statistics</p>
            </div>

            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Reset All Data
                </CardTitle>
                <CardDescription>
                  This will permanently delete all your practice sessions, scores, and statistics. This action cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Reset Data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete all your practice data,
                        including sessions, scores, and statistics.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleResetData} className="bg-destructive text-white hover:bg-destructive/90">
                        Yes, reset all data
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>

          {/* その他の設定 */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">About</h3>
              <p className="text-sm text-muted-foreground">Application information</p>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Chord Tone Practice App</p>
              <p>Version 1.0.0</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

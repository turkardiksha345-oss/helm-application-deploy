{{- define "two-tier-app.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "two-tier-app.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{- define "two-tier-app.labels" -}}
helm.sh/chart: {{ include "two-tier-app.chart" . }}
{{ include "two-tier-app.selectorLabels" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{- define "two-tier-app.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "two-tier-app.selectorLabels" -}}
app.kubernetes.io/name: {{ include "two-tier-app.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{- define "two-tier-app.serviceAccountName" -}}
{{- if .Values.serviceAccount.create -}}
{{- default (include "two-tier-app.fullname" .) .Values.serviceAccount.name -}}
{{- else -}}
{{- default "default" .Values.serviceAccount.name -}}
{{- end -}}
{{- end -}}

{{- define "two-tier-app.frontendName" -}}
{{- printf "%s-frontend" (include "two-tier-app.fullname" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "two-tier-app.backendName" -}}
{{- printf "%s-backend" (include "two-tier-app.fullname" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

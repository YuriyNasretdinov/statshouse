// Copyright 2022 V Kontakte LLC
//
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

package api

import (
	"strconv"
	"strings"
	"time"

	"github.com/vkcom/statshouse/internal/format"

	"github.com/vkcom/statshouse/internal/vkgo/rpc"
	"github.com/vkcom/statshouse/internal/vkgo/srvfunc"
	"github.com/vkcom/statshouse/internal/vkgo/statlogs"
)

const (
	RoutePrefix             = "/api/"
	EndpointMetric          = "metric"
	EndpointMetricList      = "metrics-list"
	EndpointMetricTagValues = "metric-tag-values"
	EndpointQuery           = "query"
	EndpointRender          = "render"
	EndpointResetFlood      = "reset-flood"
	EndpointLegacyRedirect  = "legacy-redirect"
	EndpointDashboard       = "dashboard"
	EndpointDashboardList   = "dashboards-list"
	EndpointGroup           = "group"
	EndpointGroupList       = "group-list"
	EndpointPrometheus      = "prometheus"

	userTokenName = "user"
)

type endpointStat struct {
	endpoint   string
	metric     string
	startTime  time.Time
	tokenName  string
	dataFormat string
}

func (es *endpointStat) serviceTime(code int) {
	es.logEvent(format.BuiltinMetricNameAPIEndpointServiceTime, code)
}

func (es *endpointStat) responseTime(code int) {
	es.logEvent(format.BuiltinMetricNameAPIEndpointResponseTime, code)
}

func (es *endpointStat) logEvent(statName string, code int) {
	v := time.Since(es.startTime).Seconds()
	statlogs.AccessMetricRaw(
		statName,
		statlogs.RawTags{
			Tag1: es.endpoint,
			Tag2: es.metric,
			Tag3: strconv.Itoa(code),
			Tag4: es.tokenName,
			Tag5: es.dataFormat,
		},
	).Value(v)
}

func (es *endpointStat) setTokenName(user string) {
	es.tokenName = getStatTokenName(user)
}

func getStatTokenName(user string) string {
	if strings.Contains(user, "@") {
		return userTokenName
	}

	return user
}

func newEndpointStat(endpoint string, metricID int32, dataFormat string) *endpointStat {
	return &endpointStat{
		endpoint:   endpoint,
		metric:     strconv.Itoa(int(metricID)), // metric ID key is considered "raw"
		startTime:  time.Now(),
		dataFormat: dataFormat,
	}
}

type rpcMethodStat struct {
	method    string
	startTime time.Time
}

func (ms *rpcMethodStat) serviceTime(ai accessInfo, err error) {
	var errorCode string
	switch e := err.(type) {
	case rpc.Error:
		errorCode = strconv.FormatInt(int64(e.Code), 10)
	case nil:
		errorCode = "0"
	default:
		errorCode = "-1"
	}
	v := time.Since(ms.startTime).Seconds()
	statlogs.AccessMetricRaw(
		format.BuiltinMetricNameAPIRPCServiceTime,
		statlogs.RawTags{
			Tag1: ms.method,
			Tag2: errorCode,
			Tag3: getStatTokenName(ai.user),
			Tag4: srvfunc.HostnameForStatshouse(),
		},
	).Value(v)
}

func CurrentChunksCount(brs *BigResponseStorage) func(*statlogs.Registry) {
	return func(r *statlogs.Registry) {
		r.AccessMetricRaw(
			format.BuiltinMetricNameAPIBRS,
			statlogs.RawTags{
				Tag1: srvfunc.HostnameForStatshouse(),
			},
		).Value(float64(brs.Count()))
	}
}

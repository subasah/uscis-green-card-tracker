import { useCallback, useEffect, useMemo, useState } from 'react';
import AgentInsights from './components/AgentInsights';
import CaseFinder from './components/CaseFinder';
import Dashboard from './components/Dashboard';
import LoadingState from './components/LoadingState';
import { AppTopBar, DataRefreshBar } from './components/Layout';
import ChatPresenceBar from './components/ChatPresenceBar';
import CommunityChatPanel from './components/CommunityChatPanel';
import MyUSCISCase from './components/MyUSCISCase';
import RedditInsights from './components/RedditInsights';
import { useTheme } from './hooks/useTheme';
import { useScrollHeader } from './hooks/useScrollHeader';
import { useCommunityChat } from './hooks/useCommunityChat';
import { CASE_SHEETS } from './config';
import { buildCaseGuidance } from './utils/advisoryService';
import {
  COMMUNITY_FILTER_DEFAULTS,
  TRENDS_FILTER_DEFAULTS,
  toFilterCasesInput,
} from './utils/filterHelpers';
import {
  buildInsights,
  estimateForCase,
  fetchAllData,
  filterCases,
  findSimilarCases,
  getBlockProgress,
  uniqueCountryValues,
  uniqueValues,
} from './utils/dataService';
import { fetchRedditFeed } from './utils/redditService';

export default function App() {
  const { preference, resolved, setPreference } = useTheme();
  const { hidden: headerHidden, scrolled: headerScrolled } = useScrollHeader();
  const chat = useCommunityChat();
  const [cases, setCases] = useState([]);
  const [agents, setAgents] = useState([]);
  const [rules, setRules] = useState({ rulesText: '', links: [] });
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeTab, setActiveTab] = useState('my-uscis');
  const [communityFilters, setCommunityFilters] = useState(COMMUNITY_FILTER_DEFAULTS);
  const [trendsFilters, setTrendsFilters] = useState(TRENDS_FILTER_DEFAULTS);
  const [selectedCase, setSelectedCase] = useState(null);
  const [redditFeed, setRedditFeed] = useState(null);
  const [redditError, setRedditError] = useState('');
  const [redditLoading, setRedditLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllData();
      setCases(data.cases);
      setAgents(data.agents);
      setRules(data.rules);
      setErrors(data.errors);
      setLastUpdated(new Date());
    } catch (error) {
      setErrors([error.message]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRedditFeed = useCallback(async () => {
    setRedditLoading(true);
    try {
      const feed = await fetchRedditFeed();
      setRedditFeed(feed);
      setRedditError('');
    } catch (error) {
      setRedditError(error.message);
    } finally {
      setRedditLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadRedditFeed();
  }, [loadData, loadRedditFeed]);

  const filteredTrendCases = useMemo(
    () => filterCases(cases, toFilterCasesInput(trendsFilters)),
    [cases, trendsFilters]
  );

  const insights = useMemo(() => buildInsights(filteredTrendCases), [filteredTrendCases]);

  const filterOptions = useMemo(
    () => ({
      categories: uniqueValues(cases, 'category'),
      countries: uniqueCountryValues(cases),
      receiptMonths: CASE_SHEETS.filter((sheet) => sheet.receiptMonth).map((sheet) => ({
        value: sheet.receiptMonth,
        label: sheet.name,
      })),
    }),
    [cases]
  );

  const chartKey = useMemo(
    () =>
      [
        trendsFilters.country,
        trendsFilters.category,
        trendsFilters.status,
        trendsFilters.receiptMonth,
      ].join('|'),
    [trendsFilters]
  );

  const similarCases = useMemo(
    () => (selectedCase ? findSimilarCases(cases, selectedCase) : []),
    [cases, selectedCase]
  );

  const estimate = useMemo(
    () => (selectedCase ? estimateForCase(selectedCase, similarCases) : null),
    [selectedCase, similarCases]
  );

  const blockProgress = useMemo(
    () => (selectedCase?.blockNumber ? getBlockProgress(cases, selectedCase.blockNumber) : null),
    [cases, selectedCase]
  );

  const guidance = useMemo(
    () =>
      selectedCase
        ? buildCaseGuidance({
            target: selectedCase,
            similarCases,
            agents,
            estimate,
            blockProgress,
          })
        : null,
    [selectedCase, similarCases, agents, estimate, blockProgress]
  );

  const handleSelectCase = useCallback((record) => {
    setSelectedCase((current) => (current?.id === record.id ? null : record));
  }, []);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    setSelectedCase(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleCloseCaseDetail = useCallback(() => {
    setSelectedCase(null);
  }, []);

  const selectedCaseDetail = selectedCase
    ? {
        record: selectedCase,
        estimate,
        guidance,
        blockProgress,
        similarCases,
        onSelectCase: handleSelectCase,
        onClose: handleCloseCaseDetail,
      }
    : null;

  const showDataRefresh = ['dashboard', 'agents', 'finder'].includes(activeTab);

  return (
    <div className="app-frame">
      <div
        className={[
          'app-header-shell',
          headerHidden ? 'is-hidden' : '',
          headerScrolled ? 'is-scrolled' : '',
        ].filter(Boolean).join(' ')}
      >
        <div className="app-header-inner">
          <AppTopBar
            activeTab={activeTab}
            onChange={handleTabChange}
            themePreference={preference}
            onThemeChange={setPreference}
            chatSlot={
              <ChatPresenceBar
                configured={chat.configured}
                onlineCount={chat.onlineCount}
                onOpenChat={() => chat.setChatOpen(true)}
              />
            }
          />
        </div>
      </div>

      <div className="app-shell">
      <main id="main-content" className="app-main">
        {showDataRefresh ? (
          <DataRefreshBar
            loading={loading}
            lastUpdated={lastUpdated}
            caseCount={cases.length}
            onRefresh={loadData}
            errors={errors}
          />
        ) : null}

        {loading && !cases.length ? <LoadingState /> : null}

        {activeTab === 'my-uscis' ? (
          <MyUSCISCase
            communityCases={cases}
            agents={agents}
            onSelectCommunityCase={handleSelectCase}
            onGoToFinder={() => handleTabChange('finder')}
            theme={resolved}
            selectedCommunityId={selectedCase?.id}
            communityCaseDetail={selectedCaseDetail}
          />
        ) : null}

        {activeTab === 'finder' ? (
          <CaseFinder
            cases={cases}
            filters={communityFilters}
            filterOptions={filterOptions}
            onFiltersChange={setCommunityFilters}
            selectedId={selectedCase?.id}
            onSelectCase={handleSelectCase}
            caseDetail={selectedCaseDetail}
          />
        ) : null}

        {activeTab === 'dashboard' ? (
          <Dashboard
            insights={insights}
            cases={filteredTrendCases}
            filters={trendsFilters}
            filterOptions={filterOptions}
            onFiltersChange={setTrendsFilters}
            chartKey={chartKey}
            theme={resolved}
          />
        ) : null}

        {activeTab === 'agents' ? (
          <AgentInsights agents={agents} rules={rules} />
        ) : null}

        {activeTab === 'reddit' ? (
          <RedditInsights
            feed={redditFeed}
            loading={redditLoading}
            error={redditError}
            onRefresh={loadRedditFeed}
          />
        ) : null}
      </main>

      <footer className="app-footer">
        <p>Informational only — not legal advice or official USCIS guidance. USCIS JSON is processed locally in your browser.</p>
      </footer>
      </div>

      <CommunityChatPanel
        open={chat.chatOpen}
        onClose={() => chat.setChatOpen(false)}
        configured={chat.configured}
        ready={chat.ready}
        loading={chat.loading}
        sending={chat.sending}
        error={chat.error}
        profile={chat.profile}
        messages={chat.messages}
        onlineCount={chat.onlineCount}
        authorId={chat.authorId}
        canChat={chat.canChat}
        sendMessage={chat.sendMessage}
      />
    </div>
  );
}

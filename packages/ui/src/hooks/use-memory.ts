import BigNumber from 'bignumber.js'
import {sort} from 'remeda'

import {LOADING_DASH} from '@/constants'
import {trpcReact} from '@/trpc/trpc'
import {t} from '@/utils/i18n'
import {maybePrettyBytes} from '@/utils/pretty-bytes'
import {isMemoryLow, trpcMemoryToLocal} from '@/utils/system'

export function useMemory(options: {poll?: boolean} = {}) {
	const memoryQ = trpcReact.system.memoryUsage.useQuery(undefined, {
		// Sometimes we won't be able to get disk usage, so prevent retry
		retry: false,
		// We do want refetching to happen on a schedule though
		refetchInterval: options.poll ? 500 : undefined,
	})

	const transformed = trpcMemoryToLocal(memoryQ.data)

	return {
		data: memoryQ.data,
		isLoading: memoryQ.isLoading,
		//
		...transformed,
		apps: sort(memoryQ.data?.apps ?? [], (a, b) => b.used - a.used),
		isMemoryLow: isMemoryLow({size: transformed?.size, used: transformed?.used}),
	}
}

export function useMemoryForUi(options: {poll?: boolean} = {}) {
	const {isLoading, used, size, available, apps, isMemoryLow} = useMemory({poll: options.poll})

	if (isLoading) {
		return {
			value: LOADING_DASH,
			valueSub: '/ ' + LOADING_DASH,
			secondaryValue: LOADING_DASH,
			progress: 0,
		}
	}

	return {
		value: maybePrettyBytes(used),
		valueSub: `/ ${maybePrettyBytes(size)}`,
		secondaryValue: t('something-left', {left: maybePrettyBytes(available)}),
		progress: BigNumber(used ?? 0 * 100)
			.dividedBy(size ?? 0)
			.toNumber(),
		isMemoryLow,
		apps,
	}
}
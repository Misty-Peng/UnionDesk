import { Button, Popconfirm, Space, Table, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import React, { useCallback, useEffect, useState } from "react";
import type { IamUser } from "@uniondesk/shared";
import { PermissionAction, deleteUser, fetchOffboardPoolUsers, restoreUser } from "@uniondesk/shared";

const OffboardPoolPage: React.FC = () => {
  const [users, setUsers] = useState<IamUser[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchOffboardPoolUsers();
      setUsers(data);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "加载离职池失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const onRestore = async (userId: number) => {
    try {
      await restoreUser(userId);
      message.success("复职成功");
      await loadData();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "复职失败");
    }
  };

  const onDelete = async (userId: number) => {
    try {
      await deleteUser(userId);
      message.success("彻底删除成功");
      await loadData();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "删除失败");
    }
  };

  const columns: ColumnsType<IamUser> = [
    { title: "用户名", dataIndex: "username" },
    { title: "手机号", dataIndex: "mobile" },
    { title: "邮箱", dataIndex: "email", render: (value?: string | null) => value ?? "-" },
    { title: "角色", dataIndex: "roleCodes", render: (value: string[]) => value.join(", ") || "-" },
    { title: "离职时间", dataIndex: "offboardedAt", render: (value?: string | null) => value ?? "-" },
    { title: "离职原因", dataIndex: "offboardReason", render: (value?: string | null) => value ?? "-" },
    {
      title: "操作",
      width: 260,
      render: (_, record) => (
        <Space>
          <PermissionAction code="action.iam.users.restore">
            <Popconfirm title="确认复职该用户吗？" onConfirm={() => void onRestore(record.id)}>
              <Button type="link">复职</Button>
            </Popconfirm>
          </PermissionAction>
          <PermissionAction code="action.iam.users.delete">
            <Popconfirm title="确认彻底删除该用户吗？此操作不可恢复。" onConfirm={() => void onDelete(record.id)}>
              <Button danger type="link">
                彻底删除
              </Button>
            </Popconfirm>
          </PermissionAction>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button onClick={() => void loadData()}>刷新</Button>
      </Space>
      <Table<IamUser> rowKey="id" loading={loading} columns={columns} dataSource={users} />
    </div>
  );
};

export default OffboardPoolPage;
